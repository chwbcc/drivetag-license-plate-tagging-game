import CoreLocation
import Foundation
import Observation

/// Wraps a one-shot location request used to attach coordinates to a tag.
@Observable
final class LocationService: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    var coordinate: CLLocationCoordinate2D?
    var authorizationStatus: CLAuthorizationStatus
    var isRequesting: Bool = false

    var hasLocation: Bool { coordinate != nil }

    var isDenied: Bool {
        authorizationStatus == .denied || authorizationStatus == .restricted
    }

    override init() {
        authorizationStatus = manager.authorizationStatus
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    /// Asks for permission if needed, then requests a single fix.
    func request() {
        switch manager.authorizationStatus {
        case .notDetermined:
            isRequesting = true
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            isRequesting = true
            manager.requestLocation()
        default:
            isRequesting = false
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            self.authorizationStatus = status
            if status == .authorizedWhenInUse || status == .authorizedAlways {
                manager.requestLocation()
            } else {
                self.isRequesting = false
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let coordinate = locations.last?.coordinate
        Task { @MainActor in
            self.coordinate = coordinate
            self.isRequesting = false
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            self.isRequesting = false
        }
    }
}
