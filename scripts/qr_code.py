import cv2
from pyzbar.pyzbar import decode
import numpy as np
import netifaces as net
import ipaddress


NO_QR = "no-qr"

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
    return "1.1.1.1"  # TODO: implement: read qr codes until valid ip qr code is read


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


def matrix_to_cv2_img(matrix):
    return np.array(matrix, dtype=np.uint8)


def scale_image_up(img, factor):
    height, width = img.shape
    return cv2.resize(img, (height * factor, width * factor), interpolation=cv2.INTER_AREA)


def decode_qr_from_matrix(matrix):
    img = matrix_to_cv2_img(matrix)
    img_scaled = scale_image_up(img, 40)  # fucking pyzbar ist weitsichtig
    decoded_objects = decode(img_scaled)
    if decoded_objects:
        return decoded_objects[0].data.decode()
    else:
        return NO_QR


def read_qr_code():
    cap = cv2.VideoCapture(0)
    detector = cv2.QRCodeDetector()

    result = ""

    while True:
        _, img = cap.read()

        bbox = None
        code = None
        try:
            _, bbox, code = detector.detectAndDecodeCurved(img)
        except:
            print("cv2 der hurensohn")

        if bbox is not None:
            for i in range(len(bbox)):
                cv2.rectangle(img, (int(bbox[i][0][0]), int(bbox[i][0][1])), (int(bbox[i][2][0]), int(bbox[i][2][1])),
                              (255, 0, 255), 2)
            if code is not None:
                result = decode_qr_from_matrix(code)
                if result != NO_QR:
                    break
        cv2.imshow("code detector", img)
        if cv2.waitKey(1) == ord("q"):
            break
    cap.release()
    cv2.destroyAllWindows()
    return result


if __name__ == '__main__':
    main()
