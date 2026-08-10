import type { Metadata } from 'next'
import { PostList } from './post-list'

export const metadata: Metadata = { title: '글' }

export default function PostsPage() {
  return (
    <main>
      <h1>글</h1>
      <PostList />
    </main>
  )
}
