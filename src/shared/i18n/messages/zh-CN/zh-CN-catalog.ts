// Namespaces: catalog, cardCatalog, eventCatalog, gachaCatalog, musicCatalog
// Lazy bundle for the Sekai catalog pages (/cards, /events, /gachas, /music).
// Enum labels (units, attributes, rarities, event/gacha types, difficulties)
// stay in the core bundle because other features render them too.
export default {
  "catalog": {
    "region": {
      "label": "服务器"
    },
    "search": {
      "label": "搜索",
      "placeholder": "搜索…",
      "clear": "清除搜索"
    },
    "filters": {
      "title": "筛选",
      "reset": "重置筛选",
      "active": "{count} 项筛选生效"
    },
    "results": {
      "count": "共 {count} 项",
      "empty": "没有符合当前筛选条件的内容",
      "emptyHint": "试试放宽筛选条件，或切换服务器。",
      "loadError": "数据加载失败",
      "retry": "重试",
      "downloading": "正在下载 Master 数据… {progress}%"
    },
    "sort": {
      "label": "排序",
      "asc": "升序",
      "desc": "降序"
    },
    "view": {
      "label": "视图",
      "grid": "网格",
      "list": "列表"
    },
    "pagination": {
      "label": "分页",
      "first": "第一页",
      "prev": "上一页",
      "next": "下一页",
      "last": "最后一页",
      "page": "第 {page} 页",
      "pageOf": "{page} / {total}",
      "pageSize": "每页数量",
      "perPage": "每页 {size}",
      "jump": "跳转到页码",
      "summary": "共 {total} 项 · 第 {page} / {pages} 页"
    },
    "status": {
      "upcoming": "即将开始",
      "ongoing": "进行中",
      "ended": "已结束"
    },
    "countdown": {
      "toStart": "距开始",
      "toEnd": "距结束",
      "toAggregate": "距结算",
      "reached": "已到达",
      "days": "{days}天",
      "hours": "{hours}小时",
      "minutes": "{minutes}分",
      "seconds": "{seconds}秒"
    },
    "detail": {
      "backToList": "返回{list}",
      "breadcrumb": "页面路径",
      "notFound": "在当前服务器的数据中找不到该条目。",
      "loadError": "详情数据加载失败",
      "id": "ID",
      "assetName": "资源名",
      "releaseAt": "上线时间",
      "period": "期间",
      "viewAll": "查看全部",
      "viewAllCount": "查看全部 ({count})",
      "zoom": "点击放大查看",
      "showMore": "展开",
      "showLess": "收起",
      "unknown": "未知"
    },
    "lightbox": {
      "description": "图片预览",
      "zoomIn": "放大",
      "zoomOut": "缩小",
      "openInNewTab": "新标签页打开"
    },
    "character": {
      "label": "角色",
      "toggleUnit": "切换 {unit} 全员"
    },
    "unit": {
      "label": "团体"
    },
    "attr": {
      "label": "属性"
    },
    "rarity": {
      "label": "稀有度"
    },
    "year": {
      "label": "年份",
      "all": "全部年份"
    },
    "type": {
      "label": "类型"
    },
    "statusFilter": {
      "label": "状态"
    }
  },

  // ---------------------------------------------------------------------
  // cardCatalog — owned by the cards module (src/modules/cards)
  // ---------------------------------------------------------------------
  "cardCatalog": {
  },

  // ---------------------------------------------------------------------
  // eventCatalog — owned by the events module (src/modules/events)
  // ---------------------------------------------------------------------
  "eventCatalog": {
  },

  // ---------------------------------------------------------------------
  // gachaCatalog — owned by the gachas module (src/modules/gachas)
  // ---------------------------------------------------------------------
  "gachaCatalog": {
  },

  // ---------------------------------------------------------------------
  // musicCatalog — owned by the music-library module (src/modules/music-library)
  // ---------------------------------------------------------------------
  "musicCatalog": {
  }
} as const
