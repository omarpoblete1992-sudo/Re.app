import { db, storage } from "./firebase"
import {
    collection,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    increment,
    QueryDocumentSnapshot
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Umbral de interacciones para revelar fotos mutuamente
export const INTERACTION_THRESHOLD = 50

export type UserRole = "user" | "moderator" | "admin"

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
    role?: UserRole
    silencedUntil?: Timestamp
    banned?: boolean
    gender?: string
    interestedIn?: string
}

export interface ModerationLog {
    id?: string
    action: "silence" | "unsilence" | "ban" | "unban" | "delete_post"
    targetUserId: string
    moderatorId: string
    details?: string
    createdAt: Timestamp
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

export interface Continuation {
    id: string
    postId: string
    authorId: string
    authorNickname: string
    text: string
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

export async function uploadAvatar(uid: string, file: File): Promise<string> {
    const storageRef = ref(storage, `avatars/${uid}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    // Update the user profile with the new photo URL
    const userRef = doc(db, "users", uid)
    await setDoc(userRef, { photoUrl: downloadURL }, { merge: true })

    return downloadURL
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

export async function getPostsByFeed(feedType: string, currentUserProfile?: UserProfile | null): Promise<Post[]> {
    const postsRef = collection(db, "posts")
    let q

    switch (feedType) {
        case "pareja":
            // Filter by feed=pareja PLUS gender matching. Increase limit to allow client-side mutual filtering.
            if (currentUserProfile?.interestedIn && currentUserProfile.interestedIn !== "everyone") {
                q = query(
                    postsRef,
                    where("feed", "==", "pareja"),
                    where("gender", "==", currentUserProfile.interestedIn),
                    orderBy("createdAt", "desc"),
                    limit(50)
                )
            } else {
                q = query(
                    postsRef,
                    where("feed", "==", "pareja"),
                    orderBy("createdAt", "desc"),
                    limit(50)
                )
            }
            break

        case "amistad":
            // Show all feeds EXCEPT nocturno and cadaver_exquisito
            q = query(
                postsRef,
                where("feed", "in", ["pareja", "amistad", "maestrisimos", "nadiemequiere"]),
                orderBy("createdAt", "desc"),
                limit(20)
            )
            break

        case "cadaver_exquisito":
            q = query(
                postsRef,
                where("feed", "==", "cadaver_exquisito"),
                orderBy("createdAt", "desc"),
                limit(20)
            )
            break

        case "maestrisimos":
            // Top 100 most liked posts (excluding nocturno)
            q = query(
                postsRef,
                where("feed", "in", ["pareja", "amistad", "maestrisimos", "nadiemequiere"]),
                orderBy("likes", "desc"),
                limit(100)
            )
            break

        case "nadiemequiere":
            // Posts with few likes, most recent first (excluding nocturno)
            q = query(
                postsRef,
                where("feed", "in", ["pareja", "amistad", "maestrisimos", "nadiemequiere"]),
                orderBy("likes", "asc"),
                limit(20)
            )
            break

        case "nocturno":
            q = query(
                postsRef,
                where("feed", "==", "nocturno"),
                orderBy("createdAt", "desc"),
                limit(20)
            )
            break

        default:
            // Recientes: all feeds except nocturno
            q = query(
                postsRef,
                where("feed", "in", ["pareja", "amistad", "maestrisimos", "nadiemequiere"]),
                orderBy("createdAt", "desc"),
                limit(20)
            )
            break
    }

    const snapshot = await getDocs(q)
    let posts = snapshot.docs.map(docToPost)

    if (feedType === "pareja" && currentUserProfile) {
        posts = posts.filter(post => {
            // If it's the user's own post, include it or not? Usually we include it.
            if (post.userId === currentUserProfile.uid) return true;

            // 1. Post author must match my interest
            const myInterest = currentUserProfile.interestedIn;
            const matchesMyInterest = !myInterest || myInterest === "everyone" || post.gender === myInterest;

            // 2. Post author must be interested in my gender
            const authorInterest = post.interestedIn;
            const matchesAuthorInterest = !authorInterest || authorInterest === "everyone" || authorInterest === currentUserProfile.gender;

            return matchesMyInterest && matchesAuthorInterest;
        });

        // Limit the results after filtering
        posts = posts.slice(0, 20);
    }

    return posts
}

export async function likePost(postId: string) {
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
        likes: increment(1),
    })
}

export async function addContinuation(postId: string, authorId: string, authorNickname: string, text: string) {
    const continuationsRef = collection(db, "posts", postId, "continuations")
    const newContRef = doc(continuationsRef)
    await setDoc(newContRef, {
        postId,
        authorId,
        authorNickname,
        text,
        createdAt: serverTimestamp(),
    })
    return newContRef.id
}

export async function getContinuations(postId: string): Promise<Continuation[]> {
    const continuationsRef = collection(db, "posts", postId, "continuations")
    const q = query(continuationsRef, orderBy("createdAt", "asc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Continuation[]
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

    // Auto-reveal: if interaction count reaches threshold, reveal both users
    const connSnap = await getDoc(connRef)
    if (connSnap.exists()) {
        const data = connSnap.data()
        if (data.interactionCount >= INTERACTION_THRESHOLD) {
            const bothUsers = [data.fromUserId, data.toUserId]
            const alreadyRevealed = data.revealedUsers || []
            if (alreadyRevealed.length < 2) {
                await updateDoc(connRef, {
                    revealedUsers: bothUsers
                })
            }
        }
    }
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

// ── Moderation Functions ────────────────────────────────────────────

export function isUserSilenced(profile: UserProfile | null): boolean {
    if (!profile?.silencedUntil) return false
    return profile.silencedUntil.toDate() > new Date()
}

export async function silenceUser(targetUid: string, moderatorId: string, hours: number = 24) {
    const silencedUntil = Timestamp.fromDate(
        new Date(Date.now() + hours * 60 * 60 * 1000)
    )
    const userRef = doc(db, "users", targetUid)
    await updateDoc(userRef, { silencedUntil })

    // Log the action
    await setDoc(doc(collection(db, "moderation_logs")), {
        action: "silence",
        targetUserId: targetUid,
        moderatorId,
        details: `Silenciado por ${hours} horas`,
        createdAt: serverTimestamp(),
    })
}

export async function unsilenceUser(targetUid: string, moderatorId: string) {
    const userRef = doc(db, "users", targetUid)
    await updateDoc(userRef, { silencedUntil: null })

    await setDoc(doc(collection(db, "moderation_logs")), {
        action: "unsilence",
        targetUserId: targetUid,
        moderatorId,
        details: "Silencio removido",
        createdAt: serverTimestamp(),
    })
}

export async function banUser(targetUid: string, moderatorId: string) {
    const userRef = doc(db, "users", targetUid)
    await updateDoc(userRef, { banned: true })

    await setDoc(doc(collection(db, "moderation_logs")), {
        action: "ban",
        targetUserId: targetUid,
        moderatorId,
        details: "Usuario baneado",
        createdAt: serverTimestamp(),
    })
}

export async function unbanUser(targetUid: string, moderatorId: string) {
    const userRef = doc(db, "users", targetUid)
    await updateDoc(userRef, { banned: false })

    await setDoc(doc(collection(db, "moderation_logs")), {
        action: "unban",
        targetUserId: targetUid,
        moderatorId,
        details: "Ban removido",
        createdAt: serverTimestamp(),
    })
}

export async function deleteEssence(postId: string, moderatorId: string) {
    const postRef = doc(db, "posts", postId)
    const postSnap = await getDoc(postRef)

    const details = postSnap.exists()
        ? `Esencia de ${postSnap.data().nickname || "desconocido"} eliminada`
        : `Post ${postId} eliminado`

    await deleteDoc(postRef)

    await setDoc(doc(collection(db, "moderation_logs")), {
        action: "delete_post",
        targetUserId: postSnap.exists() ? postSnap.data().userId : "unknown",
        moderatorId,
        details,
        createdAt: serverTimestamp(),
    })
}

export async function getModerationLogs(maxLogs: number = 50): Promise<ModerationLog[]> {
    const logsRef = collection(db, "moderation_logs")
    const q = query(logsRef, orderBy("createdAt", "desc"), limit(maxLogs))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ModerationLog))
}
