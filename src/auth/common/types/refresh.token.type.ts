// type RefreshToken = {
//     sub: number;
//     email: string;
//     iat: number;
//     exp: number;
// };

type RefreshToken = {
    id: number;
    token: string;
    userId: number;
};
