"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { FeedItem } from "@/components/feed/feed-item"
import { FeedTabs } from "@/components/feed/feed-tabs"
import { NocturnoGate } from "@/components/feed/nocturno-gate"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense, useRef } from "react"
import { getPostsByFeed, getUserProfile, Post, UserProfile } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"
import { CreatePostForm } from "@/components/feed/create-post-form"
import { FeedDebugger } from "@/components/debug/feed-debugger"

// ── Tab titles and empty messages ────────────────────────────────────
const tabMeta: Record<string, { title: string; emptyMsg: string }> = {
  pareja: {
    title: "Pareja",
    emptyMsg: "Aún no hay esencias que resonen con tu energía",
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
  cadaver_exquisito: {
    title: "Cadáver Exquisito",
    emptyMsg: "Nadie ha iniciado una historia aún. Escribe el primer fragmento.",
  },
}

function FeedContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "pareja"
  const [isGateOpen, setIsGateOpen] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const isNocturno = type === "nocturno"

  // Debugging state
  const [debugProfile, setDebugProfile] = useState<UserProfile | null>(null)
  const [totalFetched, setTotalFetched] = useState(0)
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // State to temporarily bypass language filters when hitting an empty feed
  const [tempShowAllLanguages, setTempShowAllLanguages] = useState(false)

  const activeProfile = process.env.NODE_ENV === "development" && debugProfile ? debugProfile : profile;
  // Apply temporary bypass 
  const queryProfile = activeProfile ? {
    ...activeProfile,
    showPostsInAllLanguages: tempShowAllLanguages ? true : activeProfile.showPostsInAllLanguages
  } : null;

  // Fetch user profile for pareja gender matching
  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid).then(p => setProfile(p))

    // Cargar caché de esencias vistas/rechazadas
    const stored = localStorage.getItem(`seen_${user.uid}`)
    if (stored) {
      try {
        seenIdsRef.current = new Set(JSON.parse(stored))
      } catch (e) {
        console.error("Error leyendo vistos locales:", e)
      }
    }
  }, [user])

  // Reset gate when switching away from nocturno
  useEffect(() => {
    if (!isNocturno) setIsGateOpen(false)
  }, [isNocturno])

  // Fetch posts from Firestore
  useEffect(() => {
    async function fetchPosts() {
      // Don't fetch if nocturno and gate is closed
      if (isNocturno && !isGateOpen) {
        setLoading(false)
        return
      }

      setLoading(true)
      setHasMore(true)
      setTotalFetched(0)
      setTotalFiltered(0)
      try {
        let currentPosts: Post[] = []
        let currentLastDoc = null
        let keepTrying = true
        let fetchedAny = false

        while (keepTrying && currentPosts.length < 10) {
          const { posts: newPosts, lastDoc: newLastDoc, debugStats } = await getPostsByFeed(type, queryProfile, currentLastDoc)
          fetchedAny = true

          if (debugStats) {
            setTotalFetched(prev => prev + debugStats.fetched)
            setTotalFiltered(prev => prev + debugStats.filtered)
          }

          // Filter out seen ones
          const unseen = newPosts.filter(p => !seenIdsRef.current.has(p.id))
          currentPosts = [...currentPosts, ...unseen]
          currentLastDoc = newLastDoc

          if (!newLastDoc || newPosts.length < 20) {
            setHasMore(false)
            keepTrying = false
          }
        }

        // Save to seenIds and localStorage
        if (currentPosts.length > 0 && user) {
          currentPosts.forEach(p => seenIdsRef.current.add(p.id))
          localStorage.setItem(`seen_${user.uid}`, JSON.stringify(Array.from(seenIdsRef.current)))
        }

        setPosts(currentPosts)
        setLastDoc(currentLastDoc)
        if (!fetchedAny) setHasMore(false)
      } catch (err) {
        console.error("Error fetching posts:", err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [type, isGateOpen, isNocturno, profile, activeProfile, refreshTrigger])

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)

    try {
      let currentPosts: Post[] = []
      let currentLastDoc = lastDoc
      let keepTrying = true

      while (keepTrying && currentPosts.length < 10) {
        const { posts: newPosts, lastDoc: newLastDoc, debugStats } = await getPostsByFeed(type, activeProfile, currentLastDoc)

        if (debugStats) {
          setTotalFetched(prev => prev + debugStats.fetched)
          setTotalFiltered(prev => prev + debugStats.filtered)
        }

        const unseen = newPosts.filter(p => !seenIdsRef.current.has(p.id))
        currentPosts = [...currentPosts, ...unseen]
        currentLastDoc = newLastDoc

        if (!newLastDoc || newPosts.length < 20) {
          setHasMore(false)
        }
      }

      if (currentPosts.length > 0 && user) {
        currentPosts.forEach(p => seenIdsRef.current.add(p.id))
        localStorage.setItem(`seen_${user.uid}`, JSON.stringify(Array.from(seenIdsRef.current)))
      }

      setPosts(prev => [...prev, ...currentPosts])
      setLastDoc(currentLastDoc)
    } catch (err) {
      console.error("Error loading more:", err)
    } finally {
      setLoadingMore(false)
    }
  }

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
      <FeedTabs activeTab={type === "cadaver_exquisito" ? "amistad" : type} />

      {(type === "amistad" || type === "cadaver_exquisito") && (
        <div className="flex gap-4 mb-6 justify-center md:justify-start border-b border-border/30 pb-2">
          <Link href="/app/feed?type=amistad" className={cn("text-sm transition-colors", type === "amistad" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground")}>General</Link>
          <Link href="/app/feed?type=cadaver_exquisito" className={cn("text-sm transition-colors", type === "cadaver_exquisito" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground")}>Cadáver Exquisito (Historias)</Link>
        </div>
      )}

      <h1 className="text-3xl font-serif mb-6 text-center md:text-left">
        {meta.title}
      </h1>

      {/* Post creation form */}
      {user && (
        <CreatePostForm
          feedType={type}
          onSuccess={async () => {
            const { posts: newPosts, lastDoc: newLastDoc, debugStats } = await getPostsByFeed(type, activeProfile)

            setTotalFetched(debugStats?.fetched || 0)
            setTotalFiltered(debugStats?.filtered || 0)
            setPosts(newPosts)
            setLastDoc(newLastDoc)
            setHasMore(newPosts.length >= 20)
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse font-serif">
          {type === "pareja" ? "Estamos buscando almas compatibles contigo..." : "Buscando almas..."}
        </div>
      ) : type === "pareja" && profile && (!profile.gender || !profile.interestedIn) ? (
        <div className="text-center py-12 text-muted-foreground font-serif">
          <p className="mb-6">Completa tu perfil para descubrir conexiones compatibles.</p>
          <Link href="/app/settings" className="mx-auto block w-fit bg-primary hover:opacity-90 transition-opacity text-primary-foreground py-2 px-6 rounded-md text-sm font-medium">
            Completar Perfil
          </Link>
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
                  gender: post.gender,
                  interestedIn: post.interestedIn,
                }}
                onDeleted={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
              />
            ))}
          </div>

          <FeedDebugger
            currentProfile={activeProfile}
            onSimulateProfile={setDebugProfile}
            totalFetched={totalFetched}
            totalFiltered={totalFiltered}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />

          {posts.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground font-serif italic">
                {meta.emptyMsg} en este momento.
              </p>

              {!tempShowAllLanguages && profile && !profile.showPostsInAllLanguages && (
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl max-w-sm mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-sm">
                    Es posible que existan esencias esperando por ti en otros idiomas.
                  </p>
                  <button
                    onClick={() => {
                      setTempShowAllLanguages(true)
                      setRefreshTrigger(prev => prev + 1)
                    }}
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors py-2 rounded-xl text-sm font-semibold"
                  >
                    Ver esencias sin importar el idioma
                  </button>
                </div>
              )}
            </div>
          )}

          {posts.length > 0 && hasMore && (
            <div className="mt-8 mb-12 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Explorando la marea..." : "Cargar más esencias"}
              </button>
            </div>
          )}

          {posts.length > 0 && !hasMore && (
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
