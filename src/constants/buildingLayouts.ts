import type { BuildingItem } from '@/types/dashboard'
import markBg from '@/assets/mark-bg.png'
import markBg2 from '@/assets/mark-bg2.png'
import markIcon from '@/assets/markicon.png'
import markIcon2 from '@/assets/markicon2.png'
import markLocation from '@/assets/location.png'
import markLocation2 from '@/assets/location2.svg'

export interface CenterMarkItem {
  name: string
  image: string
  location: string
  x: string
  y: string
  width: string
  height: string
  fontSize: string
  color: string
  gap: string
  backgroundImage: string
  backgroundSize: string
  backgroundPosition: string
  industryPosition: string
  companyNumber: number
  dialogX?: string
  dialogY?: string
}

export type BuildingLayoutPreset = Omit<
  CenterMarkItem,
  'name' | 'industryPosition' | 'companyNumber'
>

const defaultMarkStyle: BuildingLayoutPreset = {
  image: markIcon,
  location: markLocation,
  width: '76px',
  height: '34px',
  fontSize: '14px',
  color: '#68ECFF',
  gap: '5px',
  backgroundImage: `url(${markBg})`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center',
  x: '0%',
  y: '0%',
}

/** 地图标点显示顺序（与设计稿一致） */
export const BUILDING_DISPLAY_ORDER = [
  '5号楼',
  '4号楼',
  '6号楼',
  '2号楼',
  '1号楼',
  '8号楼',
  '7号楼',
  '9号楼',
  '3号楼',
] as const

export const BUILDING_LAYOUT_PRESETS: Record<string, BuildingLayoutPreset> = {
  '5号楼': {
    ...defaultMarkStyle,
    x: '35%',
    y: '46%',
    dialogX: '35%',
    dialogY: '44%',
  },
  '4号楼': {
    ...defaultMarkStyle,
    x: '33%',
    y: '39%',
    dialogX: '33%',
    dialogY: '37%',
  },
  '6号楼': {
    ...defaultMarkStyle,
    x: '42%',
    y: '45%',
    dialogX: '42%',
    dialogY: '43%',
  },
  '2号楼': {
    ...defaultMarkStyle,
    x: '45%',
    y: '37%',
    dialogX: '45%',
    dialogY: '35%',
  },
  '1号楼': {
    ...defaultMarkStyle,
    x: '50.5%',
    y: '35.5%',
    dialogX: '50.5%',
    dialogY: '33.5%',
  },
  '8号楼': {
    ...defaultMarkStyle,
    x: '55%',
    y: '42%',
    dialogX: '55%',
    dialogY: '40%',
  },
  '7号楼': {
    ...defaultMarkStyle,
    x: '48.5%',
    y: '43%',
    dialogX: '48.5%',
    dialogY: '41%',
  },
  '9号楼': {
    ...defaultMarkStyle,
    x: '62.5%',
    y: '30%',
    dialogX: '62.5%',
    dialogY: '28%',
  },
  '3号楼': {
    image: markLocation2,
    location: markIcon2,
    x: '39.5%',
    y: '38%',
    dialogX: '39.5%',
    dialogY: '36%',
    width: '76px',
    height: '34px',
    fontSize: '14px',
    color: '#ffffff',
    gap: '5px',
    backgroundImage: `url(${markBg2})`,
    backgroundSize: '100% 100%',
    backgroundPosition: 'center',
  },
}

const FALLBACK_INDUSTRY = '声学科技'
const FALLBACK_COMPANY_NUMBER = 120

export function mergeBuildingMarks(
  apiList: BuildingItem[],
  presets: Record<string, BuildingLayoutPreset> = BUILDING_LAYOUT_PRESETS,
): CenterMarkItem[] {
  return apiList
    .map((item) => {
      const preset = presets[item.buildingName]
      if (!preset) {
        console.warn(`[datav] 未找到建筑布局预设: ${item.buildingName}`)
        return null
      }
      return {
        ...preset,
        name: item.buildingName,
        industryPosition: item.buildingLocation,
        companyNumber: item.companyNumber ?? 0,
      }
    })
    .filter((item): item is CenterMarkItem => item !== null)
}

export function buildFallbackCenterMarks(): CenterMarkItem[] {
  return BUILDING_DISPLAY_ORDER.map((name) => {
    const preset = BUILDING_LAYOUT_PRESETS[name]
    return {
      ...preset,
      name,
      industryPosition: FALLBACK_INDUSTRY,
      companyNumber: FALLBACK_COMPANY_NUMBER,
    }
  })
}
