import subprocess
import time

import cv2
from pyzbar.pyzbar import decode
import netifaces as net
import ipaddress
import requests

NO_QR = "no-qr"
ADDRESS_PREFIX = "lava="
STARTUP_WAIT_TIME = 60


def main():
    time.sleep(STARTUP_WAIT_TIME)
    if has_network_connection():
        print("Device has network connection.")
    else:
        print("Device has no network connection. Please present a WIFI QR code.")
        enable_network_manager()
        ssid, password = get_wifi_info_from_qr()
        connect_to_wifi(ssid, password)

    print("Please present a QR code containing the server's IP address to the camera.")
    server_ip = get_server_address()
    open_browser(server_ip)


def get_server_address():
    while True:
        content = read_qr_code("Show Lava server address")
        address_match = extract_server_address(content)
        if address_match is not None:
            return address_match
        print("QR code does not contain valid server address. Content was", content)


def enable_network_manager():
    subprocess.run(['systemctl', 'start', 'NetworkManager'], stdout=subprocess.PIPE)
    time.sleep(3)


def extract_server_address(text):
    prefix = text[0:len(ADDRESS_PREFIX)]
    if prefix == ADDRESS_PREFIX:
        return text[len(ADDRESS_PREFIX):]
    return None


def get_wifi_info_from_qr():
    while True:
        content = read_qr_code("Show WIFI code")
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
    while True:
        if not url_is_reachable(server_ip):
            time.sleep(3)
        else:
            print("Opening browser with", server_ip)
            subprocess.call(['sudo', '-u', 'admin', 'chromium-browser', server_ip, '--kiosk'])
            break


def url_is_reachable(url):
    try:
        requests.get(url)
        return True
    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
        return False


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


def is_wifi_available(ssid):
    return ssid in [x.split(':')[0] for x in scan_wifi()]


def scan_wifi():
    process = subprocess.run(['nmcli', '-t', '-f', 'SSID,SECURITY,SIGNAL', 'dev', 'wifi'], stdout=subprocess.PIPE)
    if process.returncode == 0:
        return process.stdout.decode('utf-8').strip().split("\n")
    else:
        return []


def get_current_wifi():
    process = subprocess.run(['nmcli', '-t', '-f', 'ACTIVE,SSID', 'dev', 'wifi'], stdout=subprocess.PIPE)
    if process.returncode == 0:
        return process.stdout.decode('utf-8').strip().split(':')[1]
    else:
        return ''


def is_connected_to(ssid: str):
    return get_current_wifi() == ssid


def connect_to_wifi(ssid: str, password: str):
    if not is_wifi_available(ssid):
        return False
    subprocess.call(['nmcli', 'd', 'wifi', 'connect', ssid, 'password', password])
    return is_connected_to(ssid)


def decode_qr_from_image(img):
    decoded_objects = decode(img)
    if decoded_objects:
        return decoded_objects[0].data.decode()
    else:
        return NO_QR


def scale_image_down(img):
    return cv2.resize(img, (int(img.shape[1] * 0.5), int(img.shape[0] * 0.5)), interpolation=cv2.INTER_AREA)


def apply_info_text(info_text: str, img):
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6
    thickness = 2
    text_size = cv2.getTextSize(info_text, font, font_scale, thickness)[0]
    text_x = (img.shape[1] - text_size[0]) // 2
    text_y = img.shape[0] - thickness * 10
    rectangle_bgr = (text_x - thickness * 5, text_y - text_size[1] - thickness * 5, text_x + text_size[0] + thickness * 5, text_y + thickness * 5)
    cv2.rectangle(img, (rectangle_bgr[0], rectangle_bgr[1]), (rectangle_bgr[2], rectangle_bgr[3]), (0, 0, 0), -1)
    cv2.putText(img, info_text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness)


def read_qr_code(info_text: str = "Scanning..."):
    cap = cv2.VideoCapture(0)
    while True:
        _, img = cap.read()

        img = scale_image_down(img)

        result = decode_qr_from_image(img)
        if result != NO_QR:
            break

        apply_info_text(info_text, img)

        cv2.imshow("Image", img)
        if cv2.waitKey(1) == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    return result


if __name__ == '__main__':
    main()
