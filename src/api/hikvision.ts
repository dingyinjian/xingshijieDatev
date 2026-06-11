import axios from 'axios'
import type { HikvisionPeopleCount } from '@/types/hikvision'

const hikvisionRequest = axios.create({
  baseURL: import.meta.env.VITE_HIKVISION_BASE_URL || '/hikvision',
  timeout: 15000,
  headers: { 'Content-Type': 'application/xml' },
})

const channel = Number(import.meta.env.VITE_HIKVISION_CHANNEL || 1)
const regionId = import.meta.env.VITE_HIKVISION_REGION_ID || '1'
const timezone = import.meta.env.VITE_HIKVISION_TIMEZONE || '+08:00'

function todayRange(): { start: string; end: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return {
    start: `${y}-${m}-${d}T00:00:00${timezone}`,
    end: `${y}-${m}-${d}T23:59:59${timezone}`,
  }
}

function buildSearchXml(start: string, end: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CountingStatisticsDescription version="2.0" xmlns="http://www.hikvision.com/ver20/XMLSchema">
  <statisticType>enterExitPeoplePassingNum</statisticType>
  <reportType>daily</reportType>
  <regionsID>${regionId}</regionsID>
  <timeSpanList>
    <timeSpan>
      <startTime>${start}</startTime>
      <endTime>${end}</endTime>
    </timeSpan>
  </timeSpanList>
</CountingStatisticsDescription>`
}

function readTagSum(parent: Element, tag: string): number {
  const nodes = parent.getElementsByTagName(tag)
  let sum = 0
  for (let i = 0; i < nodes.length; i++) {
    sum += Number(nodes[i]?.textContent) || 0
  }
  return sum
}

/** 从 ISAPI XML 响应中解析今日累计进入/离开人数 */
export function parsePeopleCountXml(xml: string): { enter: number; exit: number } {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('摄像头返回数据解析失败')
  }

  const statusCode = doc.querySelector('statusCode')?.textContent
  if (statusCode && statusCode !== '1' && doc.querySelector('ResponseStatus')) {
    const msg =
      doc.querySelector('statusString')?.textContent ||
      doc.querySelector('description')?.textContent ||
      '摄像头接口返回错误'
    throw new Error(msg)
  }

  let enter = 0
  let exit = 0

  const matches = doc.getElementsByTagName('matchElement')
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const el = matches[i]
      enter += Number(el.querySelector('enterCount')?.textContent) || 0
      exit += Number(el.querySelector('exitCount')?.textContent) || 0
    }
    return { enter, exit }
  }

  // 兼容其他型号字段
  enter = readTagSum(doc.documentElement, 'enterCount')
  exit = readTagSum(doc.documentElement, 'exitCount')
  if (enter === 0 && exit === 0) {
    enter = readTagSum(doc.documentElement, 'enter')
    exit = readTagSum(doc.documentElement, 'exit')
  }

  return { enter, exit }
}

/** 测试摄像头连通性 */
export async function testHikvisionConnection(): Promise<boolean> {
  const res = await hikvisionRequest.get(
    `/ISAPI/System/Video/inputs/channels/${channel}/counting/search/capabilities`,
    { responseType: 'text' },
  )
  return res.status === 200 && !res.data.includes('<statusCode>6</statusCode>')
}

/** 查询今日客流统计（进入/离开人数） */
export async function fetchTodayPeopleCount(): Promise<HikvisionPeopleCount> {
  const { start, end } = todayRange()
  const res = await hikvisionRequest.post(
    `/ISAPI/System/Video/inputs/channels/${channel}/counting/search`,
    buildSearchXml(start, end),
    { responseType: 'text' },
  )

  const xml = typeof res.data === 'string' ? res.data : String(res.data)
  const { enter, exit } = parsePeopleCountXml(xml)

  return {
    enter,
    exit,
    visit: enter,
    updatedAt: new Date().toISOString(),
  }
}
