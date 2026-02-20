import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// ── Types ────────────────────────────────────────────────────────────

export interface UserProfile {
    email: string
    nickname: string
    birthDate: string
    gender: string
    interestedIn: string
    photoUrl?: string
    createdAt: Timestamp
}

export interface SoulData {
    bio: string
    authors: string
    credo: string
    likes: number
}

export interface FeedItemProps {
    user: {
        id: string // post id
        userId: string // actual author uid
        nickname: string
        bio: string
        authors?: string
        credo?: string
        likes?: number
        isTop100?: boolean
        age?: number
        timeAgo?: string
        feed: string
    }
}

export interface Post {
    id: string
    userId: string
    nickname: string
    bio: string
    authors?: string
    credo?: string
    feed: string
    likes: number
    age?: number
    gender: string
    interestedIn: string
    createdAt: Timestamp
}

export interface Connection {
    id: string
    fromUserId: string
    toUserId: string
    status: "pending" | "connected" | "rejected"
    interactionCount: number
    revealedUsers: string[] // Array of user UIDs who agreed to reveal
    createdAt: Timestamp
}

export interface Message {
    id?: string
    senderId: string
    text: string
    createdAt: Timestamp | any
}

// ── User Functions ───────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
    const docRef = doc(db, "users", userId)
    await updateDoc(docRef, data)
}

// ── Soul Functions ───────────────────────────────────────────────────

export async function saveSoul(userId: string, data: Omit<SoulData, "likes">) {
    const docRef = doc(db, "users", userId, "soul", "data")
    await setDoc(docRef, { ...data, likes: 0 })
}

export async function getSoul(userId: string): Promise<SoulData | null> {
    const docRef = doc(db, "users", userId, "soul", "data")
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? (docSnap.data() as SoulData) : null
}

// ── Post Functions ───────────────────────────────────────────────────

export async function createPost(post: Omit<Post, "id" | "createdAt" | "likes">) {
    const postsRef = collection(db, "posts")
    const newPostRef = doc(postsRef)
    await setDoc(newPostRef, {
        ...post,
        likes: 0,
        createdAt: serverTimestamp(),
    })
    return newPostRef.id
}

export async function getPostsByFeed(feedType: string): Promise<Post[]> {
    const postsRef = collection(db, "posts")
    let q

    if (feedType === "maestrisimos") {
        // Top 100 most liked posts
        q = query(postsRef, orderBy("likes", "desc"), limit(100))
    } else if (feedType === "nadiemequiere") {
        // Posts with less than 100 likes
        q = query(
            postsRef,
            where("likes", "<", 100),
            orderBy("likes", "asc"),
            limit(50)
        )
    } else {
        // Filter by feed type
        q = query(
            postsRef,
            where("feed", "==", feedType),
            orderBy("createdAt", "desc"),
            limit(50)
        )
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Post[]
}

export async function likePost(postId: string) {
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
        likes: increment(1),
    })
}

export async function deletePost(postId: string) {
    await deleteDoc(doc(db, "posts", postId))
}

// ── Connection Functions ─────────────────────────────────────────────

export async function createConnection(fromUserId: string, toUserId: string) {
    const connectionId = [fromUserId, toUserId].sort().join("_")
    const connRef = doc(db, "connections", connectionId)

    // Check if exists
    const snap = await getDoc(connRef)
    if (snap.exists()) return connectionId

    await setDoc(connRef, {
        fromUserId,
        toUserId,
        status: "pending",
        interactionCount: 0,
        revealedUsers: [],
        createdAt: serverTimestamp(),
    })
    return connectionId
}

export async function getConnectionsForUser(userId: string): Promise<Connection[]> {
    const connRef = collection(db, "connections")
    const q = query(
        connRef,
        where("fromUserId", "==", userId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Connection[]
}

export async function updateConnectionStatus(
    connectionId: string,
    status: "connected" | "rejected"
) {
    const connRef = doc(db, "connections", connectionId)
    await updateDoc(connRef, { status })
}

// ── Chat & Interaction Functions ────────────────────────────────────

export async function sendMessage(connectionId: string, senderId: string, text: string) {
    const messagesRef = collection(db, "connections", connectionId, "messages")
    const newMessageRef = doc(messagesRef)

    // Add message
    await setDoc(newMessageRef, {
        senderId,
        text,
        createdAt: serverTimestamp(),
    })

    // Increment interaction count
    const connRef = doc(db, "connections", connectionId)
    await updateDoc(connRef, {
        interactionCount: increment(1)
    })
}

export async function toggleIdentityReveal(connectionId: string, userId: string) {
    const connRef = doc(db, "connections", connectionId)
    const connSnap = await getDoc(connRef)

    if (!connSnap.exists()) return

    const data = connSnap.data() as Connection
    const revealedUsers = data.revealedUsers || []

    if (revealedUsers.includes(userId)) {
        // Already revealed, maybe remove? For now, we only allow "reveal"
        return
    }

    await updateDoc(connRef, {
        revealedUsers: [...revealedUsers, userId]
    })
}
