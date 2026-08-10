import { generateStaticParamsFor, importPage } from 'nextra/pages'
import type { ComponentType, ReactNode } from 'react'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

const Wrapper = getMDXComponents().wrapper as ComponentType<{
  children: ReactNode
  [key: string]: unknown
}>

export default async function MdxPage(props: {
  params: Promise<{ mdxPath?: string[] }>
}) {
  const params = await props.params
  const { default: Content, toc, metadata, sourceCode } = await importPage(
    params.mdxPath
  )

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <div className="nextra-blog-content">
        <Content {...props} params={params} />
      </div>
    </Wrapper>
  )
}
