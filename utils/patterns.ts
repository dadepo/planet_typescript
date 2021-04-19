

const relevantKeywords = ["deno", "typescript", "oak", "ecmascript", "console"]

const escapeRegex = (input:string) => {
    return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/[^a-zA-Z ]/g, "");
}

const removeEmoticons = (input: string) => {
    return input.replace(/[^\w.,\s]/g, '')
}

export const isRelevant = (summary: string): boolean => {
    return summary.split(" ").some(word => {
        return relevantKeywords.some(key => {
            const escapedWord = escapeRegex(removeEmoticons(word))
            return escapedWord.trim() && key.match(new RegExp(`\\b${escapedWord.toLowerCase()}\\b`, 'gi')) !== null
        })
    });
}
