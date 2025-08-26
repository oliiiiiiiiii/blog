---
title: 在 MacOS 上安裝與設定 Neovim
date: 2025-07-22
category: CS
tags: [neovim, Tutoria, test]
summary: 123
---
# 在 MacOS 上安裝與設定 Neovim
### 前言
大一下的時候修了一堂[網路管理與系統管理](https://www.csie.ntu.edu.tw/~hsinmu/site/courses/25springnasa)，因為常常要修改、建立各種檔案，而且都是在只有 CLI 的虛擬機上，所以每天都在用 Vim，久而久之有點愛上純文字編輯了。
不過用 Vim 寫程式還是有些不方便，畢竟少了 IDE 常見的功能。
原本打算瘋狂加外掛把 Vim 魔改一波，後來爬文發現 Neovim 比較好擴充，所以決定改裝 Neovim，順便記錄整個設定過程，寫成這篇文章。
這篇文章完全是我的安裝過程，我出現的問題都打上了 ( 但不一定跟所有用 Mac 的人都一樣 ) 。
### 安裝 Neovim
1. 沒有 Homebrew 的話要先[安裝 Homebrew](https://brew.sh/zh-tw/)
2. 安裝 Neovim
   ```bash
   brew install neovim
   ```
3. 安裝完之後檢查有沒有安裝成功
   ```bash
   nvim
   ```
   出現下圖就是安裝成功了。
   ![截圖 2025-07-22 21.04.09](https://hackmd.io/_uploads/ryPUnWpUgx.png)
### 設定 Neovim - 簡易
如果你跟我一樣想把 Neovim 打造的有 IDE 的 fu 可以直接跳到進階那邊，如果你只是想稍微做一些顯示每行的編號、顯示 syntax 這種簡易的設定可以讀這段。
我看其他文章都說設定檔在 `~/.config/nvim/init.vim`。
不過我的 `~/.config/` 下根本沒有 `nvim` 這個目錄，所以我就自己建立目錄跟檔案了。
建立 `nvim` 目錄：
```bash
mkdir -p ~/.config/nvim
```
建立 `init.vim` 檔案 ( 都裝好 Neovim 了就直接用這個開吧 ) ：
```bash
nvim ~/.config/nvim/init.vim
```
一開始的設定檔可以參考下面 ( `"` 是註解，不想要的設定可以自己加註解 ) ：
```vim
set number
syntax on
set tabstop=4
set shiftwidth=4
set expandtab
set autoindent
set mouse=a
set clipboard=unnamedplus
```
這樣就設定完 Neovim 了！||但要這樣設定還不如用本來就有的 vim 就好。||
如果你想好好打造 Neovim 可以繼續往下讀。
### 設定 Neovim - 進階
首先，如果剛剛有設定 `init.vim` 的話可以刪掉了。
#### 外掛管理
我選的是 [lazy.nvim 外掛管理器](https://github.com/folke/lazy.nvim)，把他下載下來：
```bash
git clone https://github.com/folke/lazy.nvim.git ~/.local/share/nvim/lazy/lazy.nvim
```
#### LSP
跟簡易版一樣，如果你的`~/.config/` 下沒有 `nvim` 這個目錄的話就自己創一個：
```bash
mkdir -p ~/.config/nvim
```
在 `~/.config/nvim/` 資料夾底下新增一個 `init.lua` 檔案：
```bash
nvim ~/.config/nvim/init.lua
```
貼上我改了好久的設定檔，有點懶得解釋每個部分在幹嘛，想了解就上網查吧，反正就是設定 lsp ( 這份只有 python 跟 lua 的 lsp，要加其他語言的話註解有寫要加的兩個地方，其他語言的 lsp 在 nvim 裡面打 `:Mason` 就可以看了 ) ：
```lua
vim.opt.rtp:prepend(vim.fn.stdpath("data") .. "/lazy/lazy.nvim")

require("lazy").setup({
  { "williamboman/mason.nvim" },
  { "williamboman/mason-lspconfig.nvim" },
  { "neovim/nvim-lspconfig" },

  { "hrsh7th/nvim-cmp" },
  { "hrsh7th/cmp-nvim-lsp" },
  { "hrsh7th/cmp-buffer" },
  { "hrsh7th/cmp-path" },

  { "L3MON4D3/LuaSnip" },
})

local cmp = require("cmp")
cmp.setup({
  snippet = {
    expand = function(args)
      require("luasnip").lsp_expand(args.body)
    end,
  },
  mapping = cmp.mapping.preset.insert({
    ['<C-b>'] = cmp.mapping.scroll_docs(-4),
    ['<C-f>'] = cmp.mapping.scroll_docs(4),
    ['<C-Space>'] = cmp.mapping.complete(),
    ['<C-e>'] = cmp.mapping.abort(),
    ['<CR>'] = cmp.mapping.confirm({ select = true }),
  }),
  sources = cmp.config.sources({
    { name = 'nvim_lsp' },
    { name = 'buffer' },
    { name = 'path' },
  })
})

local capabilities = require("cmp_nvim_lsp").default_capabilities()
local on_attach = function(_, bufnr)
  vim.api.nvim_buf_set_option(bufnr, 'omnifunc', 'v:lua.vim.lsp.omnifunc')
end

require("mason").setup()
require("mason-lspconfig").setup({
  ensure_installed = { "pyright", "lua_ls" }, -- 要加其他語言的話在這裡加
})

local lspconfig = require("lspconfig")
local servers = { "pyright", "lua_ls" } -- 要加其他語言的話這裡也要加

for _, server in ipairs(servers) do
  local opts = {
    capabilities = capabilities,
    on_attach = on_attach,
  }

  if server == "lua_ls" then
    opts.settings = {
      Lua = {
        workspace = {
          checkThirdParty = false,
          library = {
            vim.fn.expand("$VIMRUNTIME"),
          },
        },
        telemetry = { enable = false },
      }
    }
  end

  if server == "pyright" then
    opts.root_dir = function()
      return vim.fn.getcwd()
    end
  end

  lspconfig[server].setup(opts)
end

```
之後再啟動一次：
```bash
nvim
```
應該就會看到 lazy.vim 跑起來了，之後如果想檢查或更新各個外掛就一樣執行 `nvim` 然後打 `:Lazy` 就會跳出各個選項了。
> 有時候開 .lua 檔案會出現 `Your workspace is set to 'x'. Lua language server refused to load this dir.` 的報錯，只要在要開的檔案的同個目錄下建立一個 `.luarc.json` 就解決了，如果覺得每次都要新增一個檔案太麻煩又太多餘，想要設定成永久解決就...上網查吧哈哈哈哈哈哈，這個報錯好像很多人遇到，蠻多人在討論的，我沒有需要很常編輯 .lua 檔案所以我就放推了。

#### 外觀
lsp 弄好之後就可以調整外觀了！
先附上我的成果：
![截圖 2025-07-24 01.48.08](https://hackmd.io/_uploads/H1HDgiAIlg.png)
> 我原本是用終端機直接開 nvim，但我後來發現顏色主題什麼的怎麼改都會被終端機醜醜的顏色影響，蠻糟糕的，所以我後來下載了 Neovide。
> 因為裝了狀態列的外掛之後終端機預設字體會有問題，所以這段是如果沒有用 Neovide 或其他 GUI，直接用終端機開的話改字體要做的事 ( 或是看不慣你終端機的字體想改一個也可以看一下 ) 。
> 去 [Nerd Fonts](https://www.nerdfonts.com/font-downloads) 下載一個字體，我自己是選了 FiraCode Nerd Font。
下載好字體之後要把載下來的目錄放到 `~/Library/Fonts` 下。
之後點開終端機，在最上面那欄的終端機選擇設定 ( 如下圖 ) 。
![截圖 2025-07-23 20.20.49](https://hackmd.io/_uploads/r1ajX8R8xg.png)
就可以更改字體了！

因為終端機真的有點醜，所以我下載了 Neovide 這個 GUI app ( 結果不只是更好看，還有超級絲滑又酷炫的游標動畫 ) ：
```bash
brew install --cask neovide
```
下載好之後要用他開檔案直接在後面加檔案名稱就好，假設要開一個檔案叫 `123.py`，就直接：
```bash
neovide 123.py
```
這時候 Mac 可能會拒開，按左上角的蘋果標誌，選系統設定，找到隱私權與安全性，往下滑就會滑到拒開的警告，會有個 `仍要打開` 之類的按鈕，按下去就對了，之後就可以開了。
Neovide 吃的也是 `~/.config/nvim/init.lua` 的設定所以接下來的外觀設定也是繼續改這個檔案。
在這個設定檔裡面應該會找到下面這個放外掛的區塊：
```lua
require("lazy").setup({
  -- 這裡是外掛列表
})
```
最重要的顏色主題的部分我是去 [NnChad](https://nvchad.com/themes) 挑的，挑完之後再上網查那個名字 + nvim 就會有 github 了，裡面通常都會寫怎麼加在外掛區塊，我挑了 nord ，所以就上網查 `nord nvim`，就查到[這個](https://github.com/shaunsingh/nord.nvim)了。
還有一些狀態列、檔案樹我就直接展示程式碼，要了解的話直接上網查下面程式碼的關鍵字就好了。
把這些放在放外掛的區塊 ( 可以視需求增減 ) ：
```lua
-- 顏色主題
{ "shaunsingh/nord.nvim", priority = 1000 },

-- 狀態列
{ "nvim-lualine/lualine.nvim" },
{ "nvim-tree/nvim-web-devicons" },

-- buffer tab 視覺化
{ "akinsho/bufferline.nvim", version = "*", dependencies = "nvim-tree/nvim-web-devicons" },

-- 檔案樹
{ "nvim-tree/nvim-tree.lua", dependencies = "nvim-tree/nvim-web-devicons" },
```
裝好之後在 `require("lazy").setup` 這個區塊下面加入這些 ( 一樣視需求增減 ) ：
```lua
-- 啟用主題
vim.cmd.colorscheme("nord")

-- lualine 狀態列
require("lualine").setup({
  options = {
    theme = "auto", -- 根據主題自動變換
    section_separators = "",
    component_separators = "",
  }
})

-- bufferline 分頁列
require("bufferline").setup({})

-- 檔案樹設定
require("nvim-tree").setup({})
vim.keymap.set("n", "<leader>e", "<cmd>NvimTreeToggle<CR>", { desc = "Toggle NvimTree" })
```
然後我還加了可以讓 `cmd + c` 複製、`cmd + v` 貼上、`cmd + s` 儲存 ( 直接加在 `init.lua` 的最後面就好 ) 。
```lua
if vim.g.neovide then
  vim.g.neovide_input_use_logo = true  -- for macOS
  vim.api.nvim_set_keymap('v', '<D-c>', '"+y', { noremap = true, silent = true }) -- Cmd+C
  vim.api.nvim_set_keymap('n', '<D-v>', '"+p', { noremap = true, silent = true }) -- Cmd+V normal mode
  vim.api.nvim_set_keymap('i', '<D-v>', '<C-r>+', { noremap = true, silent = true }) -- Cmd+V insert mode
  vim.api.nvim_set_keymap('c', '<D-v>', '<C-r>+', { noremap = true, silent = true }) -- Cmd+V command mode
  vim.api.nvim_set_keymap('n', '<D-s>', ':w<CR>', { noremap = true, silent = true })
end
```
我還有弄更多的設定例如背景透明度、行號、開 terminal 小視窗、更多外觀設定 ( 這個其實就是看那個外觀的 github ) 我也不一一贅述了。