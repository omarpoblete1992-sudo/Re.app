/**
 * Reflexión — Post Character Limit System
 *
 * Base limit: 1200 characters
 * Expansion:  +1000 characters for every 100 likes
 *
 * Examples:
 *   0-99 likes   → 2500 chars max
 *   100-199 likes → 1 continuation unlocking, etc.
 *   etc.
 */

export const BASE_CHAR_LIMIT = 2500
export const EXPANSION_CHARS = 1000
export const LIKES_PER_EXPANSION = 100

export function canAddContinuation(likes: number, currentContinuationsCount: number): boolean {
    return Math.floor(likes / LIKES_PER_EXPANSION) > currentContinuationsCount
}

export function getNextExpansionAt(likes: number): number {
    return (Math.floor(likes / LIKES_PER_EXPANSION) + 1) * LIKES_PER_EXPANSION
}

export function getRemainingForExpansion(likes: number): number {
    return getNextExpansionAt(likes) - likes
}
