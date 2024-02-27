import re
import cv2
from pyzbar.pyzbar import decode
import netifaces as net
import ipaddress

NO_QR = "no-qr"
IPV4_PATTERN = r'\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'


def main():
    if has_network_connection():
        print("Device has network connection.")
    else:
        print("Device has no network connection. Please present a WIFI QR code.")
        ssid, password = get_wifi_info_from_qr()
        connect_wifi(ssid, password)

    print("Please present a QR code containing the server's IP address to the camera.")
    server_ip = get_server_ip()
    open_browser(server_ip)


def get_server_ip():
    while True:
        content = read_qr_code()
        ip_matches = extract_ipv4(content)
        if len(ip_matches) == 1 and is_valid_ipv4(ip_matches[0]):
            print("Found valid IPv4:", ip_matches[0])
            return ip_matches[0]
        else:
            print("QR code does not contain valid IPv4. Content was", content)


def extract_ipv4(text):
    return re.findall(IPV4_PATTERN, text)


def get_wifi_info_from_qr():
    while True:
        content = read_qr_code()
        ssid, password = parse_wifi_qr_content(content)
        if ssid is not None and password is not None:
            print("Found valid wifi information.")
            return ssid, password
        else:
            print("The QR code presented could not be parsed properly.")


def parse_wifi_qr_content(content):
    parts = content.split(';')
    ssid = None
    password = None
    for part in parts:
        if part.startswith('WIFI:S:'):
            ssid = part[7:]
        elif part.startswith('P:'):
            password = part[2:]
    return ssid, password


def open_browser(server_ip):
    print("open browser with url", server_ip)  # TODO: implement


def has_network_connection():
    interfaces = ["eth0", "en0", "wlan0"]
    for interface_name in interfaces:
        if has_network_interface(interface_name) and interface_has_ipv4(interface_name):
            return True
    return False


def interface_has_ipv4(interface_name):
    try:
        interface = net.ifaddresses(interface_name)
        for key, value in interface.items():
            for item in value:
                if is_valid_ipv4(item['addr']):
                    return True
    except:
        return False
    return False


def is_valid_ipv4(addr):
    try:
        return ipaddress.ip_address(addr).version == 4
    except ValueError:
        return False


def has_network_interface(interface_name):
    try:
        net.ifaddresses(interface_name)
        return True
    except:
        return False


def connect_wifi(ssid, password):
    print("connect to wifi with", ssid, "and", password)
    # TODO: implement


def decode_qr_from_image(img):
    decoded_objects = decode(img)
    if (decoded_objects):
        return decoded_objects[0].data.decode()
    else:
        return NO_QR


def scale_image_down(img):
    return cv2.resize(img, (int(img.shape[1] * 0.5), int(img.shape[0] * 0.5)), interpolation=cv2.INTER_AREA)


def read_qr_code():
    cap = cv2.VideoCapture(0)
    while True:
        _, img = cap.read()

        img = scale_image_down(img)

        result = decode_qr_from_image(img)
        if result != NO_QR:
            break

        cv2.imshow("Image", img)
        if cv2.waitKey(1) == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    return result


if __name__ == '__main__':
    main()
