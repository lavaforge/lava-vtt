#!/bin/bash

# Check if the script is run as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi


echo "Enabling legacy camera"
if grep -q "start_x=1" /boot/config.txt; then
    echo "start_x=1 is already set."
else
    if grep -q "start_x=0" /boot/config.txt; then
        sed -i "s/start_x=0/start_x=1/g" /boot/config.txt
        echo "Changed start_x=0 to start_x=1."
    else
        echo "start_x=1" >> /boot/config.txt
        echo "Added start_x=1."
    fi
fi

if grep -q "gpu_mem=128" /boot/config.txt; then
    echo "gpu_mem=128 is already set."
else
    echo "gpu_mem=128" >> /boot/config.txt
    echo "Added gpu_mem=128."
fi

if grep -q "^[^#]*camera_auto_detect=1" /boot/config.txt; then
    sed -i "/^[^#]*camera_auto_detect=1/s/^/#/" /boot/config.txt
    echo "Commented out camera_auto_detect=1."
fi


echo "Updating"
apt-get update
apt-get upgrade -y


echo "Enabling SSH"
systemctl enable ssh
systemctl start ssh


echo "Enabling VNC"
raspi-config nonint do_vnc 0


echo "Installing OpenCV"
apt-get install libopencv-dev -y
apt-get install python3-opencv


echo "Installing python libraries"
pip install pyzbar
pip install netifaces
pip install requests

# TODO: increase swap size
   #39  sudo dphys-swapfile swapoff
   #41  sudo nano /etc/dphys-swapfile ->> CONF_SWAPSIZE=1000
   #42  sudo dphys-swapfile setup
   #43  sudo dphys-swapfile swapon
# TODO: set display resolution to maximum

# TODO: dont switch of screen on inactivity


echo "Creating lava directory"
mkdir -p /lava
cd /lava || exit

if wget -O qr_code.py https://raw.githubusercontent.com/lavaforge/lava-vtt/scriptDebug/scripts/qr_code.py; then # TODO: change branch again
    echo "Download successful. Script updated or downloaded."
else
    echo "Error downloading script. Please check your internet connection or the URL."
    exit 1
fi


echo "Enabling NetworkManager-wait-online.service to wait for the network to be online"
systemctl enable NetworkManager-wait-online.service


SERVICE_FILE="/etc/systemd/system/qr_code.service"
echo "[Unit]
Description=QR Code Start Script
After=network-online.target NetworkManager-wait-online.service
Wants=network-online.target NetworkManager-wait-online.service

[Service]
Type=exec
Environment='DISPLAY=:0'
ExecStart=/usr/bin/python3 /lava/qr_code.py
Restart=on-failure
User=root

[Install]
WantedBy=graphical.target" > "$SERVICE_FILE"


systemctl daemon-reload
systemctl enable qr_code.service
systemctl start qr_code.service

echo "Systemd service qr_code.service has been created and started."

reboot