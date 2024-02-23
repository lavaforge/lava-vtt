import cv2
from pyzbar.pyzbar import decode
from PIL import Image
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

        print("Detection:", bbox, code)

        if bbox is not None:
            for i in range(len(bbox)):
                print("Bbox", bbox)
                print("Tuple 1", tuple(bbox[i][0]))
                print("Tuple 2", tuple(bbox[i][2]))
                cv2.rectangle(img, (int(bbox[i][0][0]), int(bbox[i][0][1])), (int(bbox[i][2][0]), int(bbox[i][2][1])),
                              (255, 0, 255), 2)
            if code is not None:
                print("data found: ", code)
                print(decode_qr_from_matrix(code))

        cv2.imshow("code detector", img)
        if cv2.waitKey(1) == ord("q"):
            break
    cap.release()
    cv2.destroyAllWindows()


def matrix_to_qr_image(matrix):
    size = len(matrix)
    # Create a new black/white image
    img = Image.new('L', (size, size), 1)  # '1' for 1-bit pixels, white background
    pixels = img.load()
    for i in range(size):
        for j in range(size):
            if matrix[i][j] == 255:
                pixels[i, j] = 255
            else:
                pixels[i, j] = 0
    return img


def decode_qr_from_matrix(matrix):
    img = matrix_to_qr_image(matrix)
    print("Image:", img)
    img.show()
    quit(0)
    decoded_objects = decode(cvimage)
    print("Decoded objects:", decoded_objects)
    if decoded_objects:
        return decoded_objects[0].data.decode()  # Assuming only one QR code in the image
    else:
        return "QR Code could not be decoded"


if __name__ == '__main__':
    main()
