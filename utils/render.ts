

export async function render(accepts: string[] | undefined, jsonRender: () => Promise<void>, htmlRender: () => Promise<void>): Promise<void> {
    if (accepts?.indexOf("application/json") !== -1) {
        return jsonRender()
    } else {
        return htmlRender()
    }
}