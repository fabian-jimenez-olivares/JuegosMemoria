import type { ImgHTMLAttributes } from 'react'

export function ResolvedImg({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  return <img src={src} alt="" {...rest} />
}
