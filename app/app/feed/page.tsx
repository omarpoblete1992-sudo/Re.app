"use client"

import { FeedItem } from "@/components/feed/feed-item"
import { FeedTabs } from "@/components/feed/feed-tabs"
import { NocturnoGate } from "@/components/feed/nocturno-gate"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { getPostsByFeed, Post } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"
import { CreatePostForm } from "@/components/feed/create-post-form"

// ── Tab titles and empty messages ────────────────────────────────────
const tabMeta: Record<string, { title: string; emptyMsg: string }> = {
  pareja: {
    title: "Pareja",
    emptyMsg: "No hay almas complementarias visibles hoy. ¡Sé el primero en publicar!",
  },
  amistad: {
    title: "Amistad — ¿Quién sabe?",
    emptyMsg: "Las amistades más profundas se forman cuando menos lo esperas. ¡Comparte algo!",
  },
  maestrisimos: {
    title: "Maestrísimos",
    emptyMsg: "Los maestros descansan hoy. Vuelve pronto.",
  },
  nadiemequiere: {
    title: "nadiemequiere",
    emptyMsg: "Todos merecen ser leídos. ¡Publica tu primer texto!",
  },
  nocturno: {
    title: "Nocturno",
    emptyMsg: "La noche está en silencio... por ahora.",
  },
}

function FeedContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "pareja"
  const [isGateOpen, setIsGateOpen] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const isNocturno = type === "nocturno"

  // Reset gate when switching away from nocturno
  useEffect(() => {
    if (!isNocturno) setIsGateOpen(false)
  }, [isNocturno])

  // Fetch posts from Firestore
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
        const data = await getPostsByFeed(type)
        setPosts(data)
      } catch (err) {
        console.error("Error fetching posts:", err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    // Don't fetch if nocturno and gate is closed
    if (isNocturno && !isGateOpen) {
      setLoading(false)
      return
    }

    fetchPosts()
  }, [type, isGateOpen, isNocturno])

  const meta = tabMeta[type] || { title: "Feed", emptyMsg: "No hay contenido." }

  // Nocturno gate
  if (isNocturno && !isGateOpen) {
    return (
      <div className="max-w-2xl mx-auto">
        <FeedTabs activeTab={type} />
        <NocturnoGate onEnter={() => setIsGateOpen(true)} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <FeedTabs activeTab={type} />

      <h1 className="text-3xl font-serif mb-6 text-center md:text-left">
        {meta.title}
      </h1>

      {/* Post creation form */}
      {user && (
        <CreatePostForm
          feedType={type}
          onSuccess={async () => {
            const data = await getPostsByFeed(type)
            setPosts(data)
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse font-serif">
          Buscando almas...
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {posts.map((post: Post) => (
              <FeedItem
                key={post.id}
                user={{
                  id: post.id,
                  userId: post.userId,
                  nickname: post.nickname,
                  bio: post.bio,
                  authors: post.authors,
                  credo: post.credo,
                  likes: post.likes,
                  age: post.age,
                  isTop100: post.likes >= 500,
                  timeAgo: post.createdAt?.toDate
                    ? getTimeAgo(post.createdAt.toDate())
                    : "Recién",
                  feed: post.feed,
                }}
              />
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-serif italic">
              {meta.emptyMsg}
            </div>
          )}

          {posts.length > 0 && (
            <div className="mt-12 text-center text-sm text-muted-foreground space-y-1 pb-8">
              <p>Has llegado al final de las almas visibles por hoy.</p>
              <p className="text-xs">Vuelve mañana para más conexiones reales.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMin < 1) return "Ahora mismo"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHrs < 24) return `Hace ${diffHrs}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString("es")
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Cargando almas...
      </div>
    }>
      <FeedContent />
    </Suspense>
  )
}
