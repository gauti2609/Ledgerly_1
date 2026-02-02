export function parseJwt(token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

export function getUserIdFromToken(token: string): string | null {
    try {
        const decoded = parseJwt(token);
        return decoded.sub || decoded.id || null;
    } catch (e) {
        return null;
    }
}

export function getUserEmailFromToken(token: string): string | null {
    try {
        const decoded = parseJwt(token);
        return decoded.email || null;
    } catch (e) {
        return null;
    }
}
