By default, React Native apps run in their own development server and are not able to make requests to localhost URLs because they are considered external requests. However, you can use the adb reverse command to forward requests from your device to your development machine.
Here's how you can do it:
Make sure your device is connected to your development machine with a USB cable.
> Run the following command in your terminal:
```adb reverse tcp:8000 tcp:8000```
This command forwards requests from the device's port 8000 to your development machine's port 8000. If your development server is running on a different port, you'll need to adjust the command accordingly.

In your React Native app, you can now make requests to http://localhost:8000 as if you were running the app on your development machine.