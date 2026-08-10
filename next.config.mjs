import nextra from 'nextra'

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const basePath = repository.endsWith('.github.io') ? '' : `/${repository}`
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true'

export default nextra({})({
  ...(isGitHubPagesBuild ? { output: 'export' } : {}),
  trailingSlash: true,
  basePath: isGitHubPagesBuild ? basePath : '',
  images: { unoptimized: true }
})
