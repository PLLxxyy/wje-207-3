# 快递面单打印工具 (Express Label CLI Tool)

命令行快递面单生成与管理工具。支持交互式生成面单、批量导入、历史记录管理和导出HTML打印。

## 功能特性

- **交互式生成面单** - 输入发件人/收件人信息，选择快递公司，生成面单
- **ASCII艺术预览** - 在终端中以ASCII艺术形式预览面单效果
- **批量导入** - 从JSON文件读取多条地址，批量生成面单
- **HTML导出** - 导出为HTML文件，可在浏览器中打印
- **历史记录** - 查看、管理之前生成的面单
- **支持快递公司** - 顺丰速运、圆通速递、中通快递、韵达快递、极兔速递

## 安装与运行

```bash
# 安装依赖
npm install

# 编译运行
npm run build
node dist/index.js

# 或直接使用 ts-node 运行
npx ts-node src/index.ts
```

## 使用方法

### 交互式主菜单

```bash
node dist/index.js
```

直接运行进入交互式菜单，可选择生成面单、批量导入或查看历史。

### 生成单张面单

```bash
node dist/index.js generate
# 或简写
node dist/index.js g
```

按提示输入发件人和收件人信息，选择快递公司即可生成面单。

### 批量导入

```bash
node dist/index.js batch data/sample.json
# 或简写
node dist/index.js b data/sample.json
```

JSON文件格式示例：

```json
[
  {
    "expressCompany": "SF",
    "sender": {
      "name": "张三",
      "phone": "13800001111",
      "province": "广东省",
      "city": "深圳市",
      "district": "南山区",
      "detail": "科技园路1号"
    },
    "receiver": {
      "name": "李四",
      "phone": "13900002222",
      "province": "北京市",
      "city": "北京市",
      "district": "海淀区",
      "detail": "中关村大街1号"
    }
  }
]
```

字段说明：

| 字段 | 说明 | 必填 |
|------|------|------|
| expressCompany | 快递公司代码（SF/YTO/ZTO/YD/JT） | 否（可选默认值） |
| sender.name | 发件人姓名 | 是 |
| sender.phone | 发件人手机号（11位） | 是 |
| sender.province | 发件省份 | 是 |
| sender.city | 发件城市 | 是 |
| sender.district | 发件区/县 | 否 |
| sender.detail | 发件详细地址 | 是 |
| receiver.* | 收件人信息（同上） | 是 |

### 查看历史记录

```bash
node dist/index.js history
# 或简写
node dist/index.js h
```

## 快递公司代码

| 名称 | 代码 |
|------|------|
| 顺丰速运 | SF |
| 圆通速递 | YTO |
| 中通快递 | ZTO |
| 韵达快递 | YD |
| 极兔速递 | JT |

## 项目结构

```
wje-207/
├── src/
│   ├── index.ts              # 程序入口
│   ├── types/
│   │   └── index.ts          # 类型定义
│   ├── commands/
│   │   ├── generate.ts       # 单张面单生成
│   │   ├── batch.ts          # 批量导入
│   │   └── history.ts        # 历史记录
│   └── utils/
│       ├── renderer.ts       # ASCII渲染
│       ├── storage.ts        # 数据存储
│       └── exporter.ts       # HTML导出
├── data/
│   └── sample.json           # 示例数据
├── package.json
├── tsconfig.json
└── README.md
```

## 技术栈

- Node.js + TypeScript
- chalk - 终端彩色输出
- inquirer - 交互式命令行提示
- commander - CLI参数解析
