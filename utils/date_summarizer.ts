


export const getAgo = (then: number, now: number) => {
    const diff = (now - then) / 1000;
    // if diff is less than 60seconds
    if (diff < 60) {
        return `${Math.round(diff)} seconds ago`
    }
    // if diff is between 1 mins and 60mins
    if (diff >= 60 && diff < 3600) {
        return `${Math.round(diff/60)} minutes ago`
    }
    // if diff is between 1 hour and 24hours
    if (diff >= 3600 && diff < 86400) {
        return `${Math.round(diff/3600)} hour(s) ago`
    }
    // if diff is between 1 day and 24hours
    if (diff >= 86400) {
        return `${Math.round(diff/86400)} day(s) ago`
    }
}
