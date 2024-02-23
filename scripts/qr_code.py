import cv2
from pyzbar.pyzbar import decode
import numpy as np


def main():
    cap = cv2.VideoCapture(0)
    detector = cv2.QRCodeDetector()

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
                print(decode_qr_from_matrix(code))

        cv2.imshow("code detector", img)
        if cv2.waitKey(1) == ord("q"):
            break
    cap.release()
    cv2.destroyAllWindows()


def matrix_to_cv2_img(matrix):
    return np.array(matrix, dtype=np.uint8)


def scale_image_up(img, factor):
    height, width = img.shape
    return cv2.resize(img, (height * factor, width * factor), interpolation=cv2.INTER_AREA)


def decode_qr_from_matrix(matrix):
    img = matrix_to_cv2_img(matrix)
    img_scaled = scale_image_up(img, 40) # fucking pyzbar ist weitsichtig
    decoded_objects = decode(img_scaled)
    if decoded_objects:
        return decoded_objects[0].data.decode()  # Assuming only one QR code in the image
    else:
        return "QR Code could not be decoded"


if __name__ == '__main__':
    main()
