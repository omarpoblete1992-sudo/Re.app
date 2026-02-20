/**
 * Reflexión — Post Character Limit System
 *
 * Base limit: 1200 characters
 * Expansion:  +1000 characters for every 100 likes
 *
 * Examples:
 *   0-99 likes   → 1200 chars max
 *   100-199 likes → 2200 chars max
 *   200-299 likes → 3200 chars max
 *   etc.
 */

export const BASE_CHAR_LIMIT = 1200
export const EXPANSION_CHARS = 1000
export const LIKES_PER_EXPANSION = 100

export function getMaxChars(likes: number): number {
    const expansions = Math.floor(likes / LIKES_PER_EXPANSION)
    return BASE_CHAR_LIMIT + expansions * EXPANSION_CHARS
}

export function getNextExpansionAt(likes: number): number {
    return (Math.floor(likes / LIKES_PER_EXPANSION) + 1) * LIKES_PER_EXPANSION
}

export function getRemainingForExpansion(likes: number): number {
    return getNextExpansionAt(likes) - likes
}
