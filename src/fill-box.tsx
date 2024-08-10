import React, { useEffect, useState, useRef } from "react"
import { Box, render } from "@r-tui/react"
import { getTerminalShape } from "@r-tui/terminal"

const MinColumns = 20
const MaxColumns = 60
const Step = 10
const TestCount = 5
const RenderCount = 5

function initStdout(c: number, r: number) {
  if (typeof globalThis.process === 'undefined') {
    // @ts-ignore
    globalThis.process = {}
  }

  if (typeof globalThis.process.stdout === 'undefined') {
    // @ts-ignore
    globalThis.process.stdout = {}
  }

  globalThis.process.stdout.columns = c
  globalThis.process.stdout.rows = r
}


function App({ done,  }: { done: () => void }) {
  const { width, height } = getTerminalShape()
  const [count, setCount] = useState(0)
  const handleRef = useRef(0)
  useEffect(() => {
    if (count >= RenderCount) {
      done()
      return
    }
    handleRef.current = +setTimeout(() => {
      setCount((c) => c + 1)
    }, 200)

    return () => {
      clearTimeout(handleRef.current)
    }
  }, [count])

  return (
    <Box
      width={"100%"}
      height={"100%"}
      display="flex"
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
    >
      {Array(width * height)
        .fill(0)
        .map((_, k) => {
          const x = k % width
          const y = ((k - x) / width) | 0
          const text = (x + y) & 1 ? " " : "█"
          return (
            <Box
              position="absolute"
              x={x}
              y={y}
              key={k}
              color={count & 1 ? "green" : "blue"}
              zIndex={10}
              text={text}
            />
          )
        })}
    </Box>
  )
}


function getTime(c: number, r: number) {
  initStdout(c, r)
  return new Promise<number>(r => {
    let t1 = Date.now()
    let t2 = Date.now()
    const time: number[] = []
    const done = () => {
      const avg = time.reduce((pre, cur) => pre + cur, 0) / time.length
      r(avg)
    }
    render(<App done={done} />, {
      fps: 30,
      beforeRenderRoot() {
        t1 = Date.now()
      },
      afterRenderRoot() {
        t2 = Date.now()
        time.push(t2 - t1)
      },
      write: (s) => {
        // console.log(s.length)
      }
    })
  })
}


(async () => {
  const time: number[] = []
  const size: number[] = []
  for (let col = MinColumns; col <= MaxColumns; col += Step) {
    const row = col >> 1
    let sum = 0
    for (let n = 0; n < TestCount; n++) {
      const t = await getTime(col, row)
      sum += t;
    }
    time.push(sum / TestCount)
    size.push(row * col)
  }

  console.log(JSON.stringify({
    time,
    size
  }))
})();
