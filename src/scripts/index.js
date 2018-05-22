const form = document.querySelector('.pr')
/** @type HTMLInputElement */
const numberInput = form.querySelector('[name="number"]')
const loadingIndicator = form.querySelector('.loading')
const filesContainer = document.querySelector('.files')
/** @type HTMLTemplateElement */
const fileTemplate = document.querySelector('template#single-file')

const OWNER = 'whatwg-cn'
const REPO = 'html'

form.addEventListener('submit', async function(e) {
  e.preventDefault()
  loadingPr()
  try {
    loadingText('正在获取 PR 信息……')
    const results = await loadPr(numberInput.value)
    renderList(results)
  } catch (e) {
    console.error(e)
  } finally {
    loadedPr()
  }
})

loadSearchParams()

async function loadPr(number) {
  const resp = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/pulls/${number}/files`
  )
  const files = await resp.json()
  const results = []
  for (const file of files) {
    const result = {}
    result.filename = file.filename
    result.enFilename = file.filename.replace(/\.zh\.html$/, '.en.html')
    if (result.filename === result.enFilename) {
      continue
    }
    result.zh = await loadFile(
      file.raw_url.replace(
        /^https:\/\/github.com\/(.*?)\/raw/,
        'https://raw.githubusercontent.com/$1'
      )
    )
    result.en = await loadFile(
      `https://raw.githubusercontent.com/whatwg-cn/html/master/${
        result.enFilename
      }`
    )
    results.push(result)
  }
  return results
}

function renderList(results) {
  const doms = results.map(function(result) {
    const filename = document.createElement('span')
    filename.textContent = result.filename
    const before = document.createElement('div')
    before.innerHTML = result.en
    const after = document.createElement('div')
    after.innerHTML = result.zh
    const dom = renderTemplate(fileTemplate, { filename, before, after })
    return { dom, before, after }
  })
  for (const dom of doms) {
    filesContainer.appendChild(dom.dom)
    alignParagraphsHeight(dom.before, dom.after)
  }
}

function renderTemplate(template, slots) {
  const output = template.content.cloneNode(true)
  for (const key in slots) {
    const slot = output.querySelector('[slot-' + key + ']')
    if (slot) {
      slot.appendChild(slots[key])
    }
  }
  return output
}

/**
 * 调整左右边栏的段落高度为一致
 * @param {HTMLElement} left 左边栏
 * @param {HTMLElement} right 右边栏
 */
function alignParagraphsHeight(left, right) {
  const leftChildren = left.children
  const rightChildren = right.children
  if (leftChildren.length !== rightChildren.length) {
    // 元素数量不等，直接跳过
    return
  }
  for (let i = 0; i < leftChildren.length; i++) {
    const leftChild = leftChildren[i]
    const rightChild = rightChildren[i]
    const maxHeight = Math.max(leftChild.clientHeight, rightChild.clientHeight)
    leftChild.style.minHeight = rightChild.style.minHeight = `${maxHeight}px`
    leftChild.classList.add('highlight-avaliable')
    rightChild.classList.add('highlight-available')
  }
}

async function loadFile(url) {
  loadingText(`正在读取文件 ...${url.slice(-50)}`)
  const resp = await fetch(url)
  return resp.text()
}

function loadSearchParams() {
  const m = window.location.search.match(/pr=(\d+)/)
  if (m) {
    numberInput.value = m[1]
  }
}

function loadingPr() {
  numberInput.disabled = true
  loadingIndicator.textContent = '正在加载……'
  loadingIndicator.classList.remove('hide')
  filesContainer.innerHTML = ''
}

function loadingText(str) {
  loadingIndicator.textContent = str
}

function loadedPr() {
  numberInput.disabled = false
  loadingIndicator.classList.add('hide')
}
