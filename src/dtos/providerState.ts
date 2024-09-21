
export type Source = "web" | "mobile"

export default interface ProviderState {
    source: Source,
    redirectUri?: string
}