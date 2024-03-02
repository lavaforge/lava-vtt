#!/bin/bash

# Check if the script is run as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# TODO: put script in autostart

echo "Enabling legacy camera"
if grep "start_x=1" /boot/config.txt
then
        exit
else
        sed -i "s/start_x=0/start_x=1/g" /boot/config.txt
        reboot
fi

echo "Updating"
apt-get update
apt-get upgrade -y

echo "Enabling SSH"
systemctl enable ssh
systemctl start ssh

# TODO: vnc

echo "Installing OpenCV"
apt-get install libopencv-dev -y
apt-get install python3-opencv

echo "Installing python libraries"
pip install pyzbar
pip install netifaces

echo "Creating lava directory"
mkdir -p /lava
cd /lava || exit

if [ -f "qr_code.py" ]; then
    echo "Python script already exists"
else
    echo "Python script does not exist. Downloading..."
    # TODO: replace with script from main branch
    wget https://raw.githubusercontent.com/lavaforge/lava-vtt/raspberryScript/scripts/qr_code.py
fi

echo "Starting python script"
python3 qr_code.py