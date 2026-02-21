import { db } from "./firebase"
import {
    collection,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    increment,
    QueryDocumentSnapshot
} from "firebase/firestore"

export interface UserProfile {
    uid: string
    nickname: string
    bio: string
    email?: string
    authors?: string
    credo?: string
    likes?: number
    photoUrl?: string
    identityHidden?: boolean
}

export interface SoulData {
    bio: string
    authors: string
    credo: string
    likes: number
}

export interface Post {
    id: string
    userId: string
    nickname: string
    bio: string
    authors?: string
    credo?: string
    likes: number
    age?: number
    feed: string
    gender?: string
    interestedIn?: string
    createdAt: Timestamp
}

export interface Connection {
    id: string
    fromUserId: string
    toUserId: string
    status: "pending" | "accepted" | "declined"
    interactionCount: number
    revealedUsers: string[]
    createdAt: Timestamp
}

export interface Message {
    id?: string
    senderId: string
    text: string
    createdAt: Timestamp
}

// ── User Functions ───────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
        return { uid, ...userSnap.data() } as UserProfile
    }
    return null
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", uid)
    await setDoc(userRef, data, { merge: true })
}

export async function saveSoul(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", uid)
    await setDoc(userRef, {
        ...data,
        likes: data.likes ?? 0,
        updatedAt: serverTimestamp(),
    }, { merge: true })
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

const docToPost = (doc: QueryDocumentSnapshot): Post => {
    const data = doc.data()
    return {
        id: doc.id,
        userId: data.userId || "",
        nickname: data.nickname || "Anónimo",
        bio: data.bio || "",
        authors: data.authors,
        credo: data.credo,
        likes: data.likes || 0,
        age: data.age,
        feed: data.feed || "recientes",
        gender: data.gender,
        interestedIn: data.interestedIn,
        createdAt: data.createdAt || Timestamp.now()
    }
}

export async function getPostsByFeed(feedType: string): Promise<Post[]> {
    const postsRef = collection(db, "posts")
    let q

    if (feedType === "populares") {
        q = query(postsRef, orderBy("likes", "desc"), limit(20))
    } else if (feedType === "nocturnos") {
        q = query(postsRef, where("feed", "==", "nocturnos"), orderBy("createdAt", "desc"), limit(20))
    } else {
        q = query(postsRef, orderBy("createdAt", "desc"), limit(20))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map(docToPost)
}

export async function likePost(postId: string) {
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
        likes: increment(1),
    })
}

// ── Connections/Chat ────────────────────────────────────────────────

export async function createConnection(fromUserId: string, toUserId: string) {
    const connectionId = [fromUserId, toUserId].sort().join("_")
    const connRef = doc(db, "connections", connectionId)

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

export async function sendMessage(connectionId: string, senderId: string, text: string) {
    const messagesRef = collection(db, "connections", connectionId, "messages")
    await setDoc(doc(messagesRef), {
        senderId,
        text,
        createdAt: serverTimestamp(),
    })

    const connRef = doc(db, "connections", connectionId)
    await updateDoc(connRef, {
        interactionCount: increment(1)
    })
}

export async function toggleIdentityReveal(connectionId: string, userId: string) {
    const connRef = doc(db, "connections", connectionId)
    const snap = await getDoc(connRef)
    if (!snap.exists()) return

    const revealedUsers = snap.data().revealedUsers || []
    if (revealedUsers.includes(userId)) return

    await updateDoc(connRef, {
        revealedUsers: [...revealedUsers, userId]
    })
}
