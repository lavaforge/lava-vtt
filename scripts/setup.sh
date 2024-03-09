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

# TODO: replace with script url from main branch
if wget -O qr_code.py https://raw.githubusercontent.com/lavaforge/lava-vtt/raspberryScript/scripts/qr_code.py; then
    echo "Download successful. Script updated or downloaded."
else
    echo "Error downloading script. Please check your internet connection or the URL."
    exit 1
fi


AUTOSTART_PATH="/etc/xdg/lxsession/LXDE-pi/autostart"
PYTHON_STARTER="sudo python3 /lava/qr_code.py"
if [ -f "$AUTOSTART_PATH" ]; then
    if ! grep -Fxq "$PYTHON_STARTER" "$AUTOSTART_PATH"; then
        echo "$PYTHON_STARTER" | sudo tee -a "$AUTOSTART_PATH" > /dev/null
        echo "Line added to the file."
    else
        echo "Line already exists in the file."
    fi
else
    echo "File does not exist."
fi

reboot