import Foundation

nonisolated enum SupabaseError: LocalizedError {
    case notConfigured
    case badResponse(status: Int, body: String)
    case decoding(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "The database connection is not configured."
        case .badResponse(let status, let body):
            if status == 409 { return "That record already exists." }
            return "Request failed (\(status)). \(body.isEmpty ? "Please try again." : body)"
        case .decoding:
            return "We couldn't read the server response."
        }
    }
}

/// Thin, typed wrapper over the Supabase REST (PostgREST) API.
nonisolated final class SupabaseService: Sendable {
    static let shared = SupabaseService()

    private let baseURL: URL
    private let apiKey: String
    private let session: URLSession

    private init() {
        let fallbackURL = "https://vhqpsnezcvqgikpqzdgk.supabase.co"
        let rawURL = Config.EXPO_PUBLIC_SUPABASE_URL.trimmingCharacters(in: .whitespacesAndNewlines)
        let resolved = rawURL.hasPrefix("http") ? rawURL : fallbackURL
        baseURL = URL(string: resolved) ?? URL(string: fallbackURL)!

        let rawKey = Config.EXPO_PUBLIC_SUPABASE_ANON_KEY.trimmingCharacters(in: .whitespacesAndNewlines)
        apiKey = rawKey.isEmpty
            ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXBzbmV6Y3ZxZ2lrcHF6ZGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODA1NzcsImV4cCI6MjA1MTI1NjU3N30.Fb8XtbpGa6tZzkEOSZ1cGbMOdJZfLH3yB8u76hNyBQc"
            : rawKey

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.waitsForConnectivity = false
        session = URLSession(configuration: config)
    }

    // MARK: - Request building

    private func makeRequest(
        table: String,
        query: [URLQueryItem],
        method: String,
        body: Data? = nil,
        prefer: String? = nil
    ) throws -> URLRequest {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("rest/v1/\(table)"),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = query.isEmpty ? nil : query

        guard let url = components?.url else { throw SupabaseError.notConfigured }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("drivetag-ios", forHTTPHeaderField: "x-client-info")
        if let prefer { request.setValue(prefer, forHTTPHeaderField: "Prefer") }
        request.httpBody = body
        return request
    }

    private func perform(_ request: URLRequest) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw SupabaseError.badResponse(status: -1, body: "")
        }
        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw SupabaseError.badResponse(status: http.statusCode, body: body)
        }
        return data
    }

    // MARK: - Generic verbs

    func select<T: Decodable>(
        _ type: T.Type,
        from table: String,
        query: [URLQueryItem]
    ) async throws -> [T] {
        var items = query
        if !items.contains(where: { $0.name == "select" }) {
            items.append(URLQueryItem(name: "select", value: "*"))
        }
        let data = try await perform(try makeRequest(table: table, query: items, method: "GET"))
        do {
            return try JSONDecoder().decode([T].self, from: data)
        } catch {
            throw SupabaseError.decoding(String(describing: error))
        }
    }

    func insert<Payload: Encodable, T: Decodable>(
        _ payload: Payload,
        into table: String,
        returning type: T.Type
    ) async throws -> T? {
        let body = try JSONEncoder().encode([payload])
        let request = try makeRequest(
            table: table,
            query: [URLQueryItem(name: "select", value: "*")],
            method: "POST",
            body: body,
            prefer: "return=representation"
        )
        let data = try await perform(request)
        return (try? JSONDecoder().decode([T].self, from: data))?.first
    }

    func insert<Payload: Encodable>(_ payload: Payload, into table: String) async throws {
        let body = try JSONEncoder().encode([payload])
        _ = try await perform(try makeRequest(table: table, query: [], method: "POST", body: body, prefer: "return=minimal"))
    }

    func update(
        table: String,
        matching query: [URLQueryItem],
        values: [String: JSONValue]
    ) async throws {
        let body = try JSONEncoder().encode(values)
        _ = try await perform(
            try makeRequest(table: table, query: query, method: "PATCH", body: body, prefer: "return=minimal")
        )
    }

    func delete(table: String, matching query: [URLQueryItem]) async throws {
        _ = try await perform(
            try makeRequest(table: table, query: query, method: "DELETE", prefer: "return=minimal")
        )
    }
}

/// Minimal JSON value box so heterogeneous PATCH payloads stay type-safe.
nonisolated enum JSONValue: Encodable, Sendable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case null

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .double(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}
