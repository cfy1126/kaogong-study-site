export default {
  lang: "zh-CN",
  title: "考公学习库",
  description: "公开记录考公学习进度、知识点、错题和每日复盘。",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "考公学习库",
    nav: [
      { text: "首页", link: "/" },
      { text: "行测", link: "/xingce/" },
      { text: "申论", link: "/shenlun/" },
      { text: "错题本", link: "/mistakes/" },
      { text: "学习日志", link: "/daily/" },
      { text: "知识卡片", link: "/cards/" }
    ],
    sidebar: [
      {
        text: "总览",
        items: [
          { text: "学习首页", link: "/" },
          { text: "备考计划", link: "/plan" },
          { text: "知识地图", link: "/mindmaps/" }
        ]
      },
      {
        text: "行测",
        items: [
          { text: "行测总览", link: "/xingce/" },
          { text: "资料分析", link: "/xingce/ziliao-fenxi" },
          { text: "判断推理", link: "/xingce/panduan-tuili" },
          { text: "言语理解", link: "/xingce/yanyu-lijie" },
          { text: "数量关系", link: "/xingce/shuliang-guanxi" },
          { text: "常识判断", link: "/xingce/changshi-panduan" }
        ]
      },
      {
        text: "申论",
        items: [
          { text: "申论总览", link: "/shenlun/" },
          { text: "申论脑图", link: "/mindmaps/shenlun" }
        ]
      },
      {
        text: "复盘",
        items: [
          { text: "错题本", link: "/mistakes/" },
          { text: "学习日志", link: "/daily/" },
          { text: "知识卡片", link: "/cards/" }
        ]
      }
    ],
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索",
            buttonAriaLabel: "搜索"
          },
          modal: {
            noResultsText: "没有找到结果",
            resetButtonTitle: "清除搜索",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭"
            }
          }
        }
      }
    },
    outline: {
      label: "本页目录"
    },
    docFooter: {
      prev: "上一页",
      next: "下一页"
    },
    lastUpdated: {
      text: "最后更新"
    }
  }
};
