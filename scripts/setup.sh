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

# TODO: put python script in autostart

reboot