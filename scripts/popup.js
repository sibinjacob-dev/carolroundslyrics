function getDeviceType() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/android/i.test(userAgent)) {
    return 'android';
  } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  return 'unsupported';
}
function triggerAddToHome() {
  const deviceType = getDeviceType();
  if (deviceType === 'ios') {
    alert('On iOS, tap the share button and select "Add to Home Screen."');
  } else if (deviceType === 'android') {
    alert('On Android, open the browser menu and select "Add to Home Screen."');
  }
}
function showPopup() {
  const deviceType = getDeviceType();
  if (deviceType === 'ios' || deviceType === 'android') {
    const popup = document.getElementById('addToHomePopup');
    popup.style.display = 'block';
  }
}
// Show the popup only for supported devices after a delay (2 seconds here)
setTimeout(showPopup, 2000);