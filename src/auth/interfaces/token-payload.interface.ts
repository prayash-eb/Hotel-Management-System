
export interface IAccessTokenPayload {
    id: string;
    email: string;
    role: boolean;
}

export interface IRefreshTokenPayload {
    id: string;
    email: string;
}