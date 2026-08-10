import { PostCard } from 'nextra-theme-blog'
import { getPosts } from './get-posts'

export async function PostList() {
  const posts = await getPosts()

  return posts.map(post => <PostCard key={post.route} post={post} />)
}
