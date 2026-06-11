import { createHash, randomBytes } from 'node:crypto'
import http from 'node:http'
import type { IncomingMessage } from 'node:http'
import type { Plugin } from 'vite'

interface DigestParams {
  realm?: string
  nonce?: string
  qop?: string
  opaque?: string
}

interface HikvisionEnv {
  host: string
  port: number
  username: string
  password: string
}

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex')
}

/** 解析海康 WWW-Authenticate 头（支持 realm 含括号） */
function parseDigestHeader(header: string): DigestParams {
  const params: DigestParams = {}
  const regex = /(\w+)=(?:"([^"]*)"|'([^']*)'|([^,\s]+))/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(header))) {
    params[match[1] as keyof DigestParams] = match[2] ?? match[3] ?? match[4]
  }
  return params
}

function buildDigestAuth(
  method: string,
  uri: string,
  username: string,
  password: string,
  params: DigestParams,
): string {
  const ha1 = md5(`${username}:${params.realm}:${password}`)
  const ha2 = md5(`${method}:${uri}`)
  const nc = '00000001'
  const cnonce = randomBytes(8).toString('hex')

  if (params.qop) {
    const response = md5(`${ha1}:${params.nonce}:${nc}:${cnonce}:${params.qop}:${ha2}`)
    return (
      `Digest username="${username}", realm="${params.realm}", nonce="${params.nonce}", ` +
      `uri="${uri}", algorithm=MD5, qop=${params.qop}, nc=${nc}, cnonce="${cnonce}", ` +
      `response="${response}"` +
      (params.opaque ? `, opaque="${params.opaque}"` : '')
    )
  }

  const response = md5(`${ha1}:${params.nonce}:${ha2}`)
  return (
    `Digest username="${username}", realm="${params.realm}", nonce="${params.nonce}", ` +
    `uri="${uri}", response="${response}"` +
    (params.opaque ? `, opaque="${params.opaque}"` : '')
  )
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function proxyWithDigest(
  config: HikvisionEnv,
  method: string,
  path: string,
  headers: Record<string, string>,
  body: Buffer,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    let retried = false

    const send = (authHeader?: string) => {
      const reqHeaders: Record<string, string> = { ...headers, host: config.host }
      if (body.length > 0) reqHeaders['content-length'] = String(body.length)
      if (authHeader) reqHeaders.authorization = authHeader

      const req = http.request(
        {
          hostname: config.host,
          port: config.port,
          path,
          method,
          headers: reqHeaders,
          // 海康设备偶发返回非标准 HTTP 头，需宽松解析
          insecureHTTPParser: true,
        },
        (res) => {
          const chunks: Buffer[] = []
          res.on('data', (chunk) => chunks.push(chunk))
          res.on('end', () => {
            const responseBody = Buffer.concat(chunks).toString('utf-8')

            // 仅重试一次：首次 401 后带 Digest 再请求；仍 401 则判定为密码错误
            if (res.statusCode === 401 && res.headers['www-authenticate'] && !retried) {
              retried = true
              const auth = Array.isArray(res.headers['www-authenticate'])
                ? res.headers['www-authenticate'][0]
                : res.headers['www-authenticate']
              const params = parseDigestHeader(auth || '')
              const digestHeader = buildDigestAuth(method, path, config.username, config.password, params)
              send(digestHeader)
              return
            }

            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: responseBody,
            })
          })
        },
      )

      req.on('error', reject)
      if (body.length > 0) req.write(body)
      req.end()
    }

    send()
  })
}

/**
 * 开发环境代理海康 ISAPI 请求，处理 Digest 认证与跨域。
 * 浏览器 → /hikvision/ISAPI/... → 摄像头
 */
export function hikvisionProxyPlugin(env: Record<string, string> = {}): Plugin {
  const hikvisionConfig: HikvisionEnv = {
    host: env.HIKVISION_HOST || '192.168.10.55',
    port: Number(env.HIKVISION_PORT || 80),
    username: env.HIKVISION_USERNAME || 'admin',
    password: (env.HIKVISION_PASSWORD || '').trim(),
  }

  return {
    name: 'hikvision-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/hikvision')) return next()

        const targetPath = req.url.replace(/^\/hikvision/, '') || '/'
        const method = req.method || 'GET'

        try {
          const body = method === 'GET' || method === 'HEAD' ? Buffer.alloc(0) : await readBody(req)
          const forwardHeaders: Record<string, string> = {}
          if (req.headers['content-type']) {
            forwardHeaders['content-type'] = req.headers['content-type'] as string
          }

          const result = await proxyWithDigest(
            hikvisionConfig,
            method,
            targetPath,
            forwardHeaders,
            body,
          )

          if (result.status === 401) {
            console.error(
              '[hikvision-proxy] 认证失败(401)：请检查 .env.development 中 HIKVISION_USERNAME / HIKVISION_PASSWORD 是否与摄像头 Web 登录密码一致',
            )
          }

          res.statusCode = result.status
          res.setHeader('Content-Type', result.headers['content-type'] || 'application/xml')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(result.body)
        } catch (err) {
          const message = err instanceof Error ? err.message : '代理请求失败'
          console.error('[hikvision-proxy]', message)
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      })

      console.log(
        `[hikvision-proxy] → http://${hikvisionConfig.host}:${hikvisionConfig.port} ` +
          `(Digest/MD5, user: ${hikvisionConfig.username})`,
      )
    },
  }
}
