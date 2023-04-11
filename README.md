# ewx-viewer
Early Warning Explorer -data.rcmrd.org/ewx-viewer
REQUIREMENTS: 
(The following software versions are required for GeoEngine)
*Java JRE, 1.8 or 1.7
*GeoServer, 2.11.0
*MySQL, 5.0 or later
*Python, 2.7 (Installer included)
*PIP, 1.6 or later (Installer included)
*GDAL, 1.11.0 (Installer included)
*Rasterstats, 0.3.3 (Installer included)
*Numpy, 1.8.1  (Installer included)
*Shapely, 1.3.2 (Installer included)
*joblib (pip install package)

------------------------------------------------------------------------------------------------------------
Basic Installation Instructions
------------------------------------------------------------------------------------------------------------
Using the GeoEngine_Dependencies_pkg.zip provided, right click and select ‘Extract All’ to your preferred directory. For the purposes of the rest of these instructions, %GeoEngine_Dependencies% refers to the location you extracted the files to.

Setting an environmental variable: 
1)	Press the Windows key and type “run” and press “enter”. 
2)	In the Run dialogue box, enter “SystemPropertiesAdvanced”.
3)	Click the “Environmental Variables…” button. 
4)	Click “Edit” to edit an existing variable, click “New” to add a new variable.

Python
Python version 2.7 is required and should be installed in a separate location if another version exists.
1)	Run the installer: %GeoEngine_Dependencies%\install\32-bit_installers\python-2.7.msi
2)	If python is installed to C: root then set Environmental Variables:
PYTHON_HOME: C:\Python27
Add to PATH: %PYTHON_HOME%;%PYTHON_HOME%\Scripts\

pip
1)	Open an elevated command prompt (right click and select “Run as Administrator”) 
2)	Navigate to the folder containing get-pip.py:        
            >cd %GeoEngine_Dependencies%\install
3)	Run get-pip.py in the command prompt:
      >python get-pip.py 

GDAL
NOTE: While the installation of GDAL core is not necessary for EWX to run, it can be a very useful tool for troubleshooting/verifying files such as gdalinfo. 
1)	Install GDAL core using the installer provided: %GeoEngine_Dependencies%\install\gdal-201-1500-core.msi
2)	Install Complete version.
3)	Set the Environmental Variables:
*Add to PATH: C:\Program Files\GDAL
*GDAL_DATA: C:\Program Files\GDAL\gdalplugins 
*GDAL_DRIVER_PATH: C:\Program Files\GDAL\gdal-data 

3)	Check that GDAL is working by opening a command prompt and typing the command:
gdalinfo --version
If the command returns a version number, you installation is working.

4)	REQUIRED: Install GDAL python plug-ins: 
%GeoEngine_Dependencies%\install\32-bit\installers\GDAL-1.11.0.win32-py2.7.exe

Numpy
Install Numpy using the installer in %GeoEngine_Dependencies%\install\32-bit_installers\numpy-MKL-1.8.1.win32-py2.7.exe

Shapely
Install Shapely using the installer in %GeoEngine_Dependencies%\install\32-bit_installers\Shapely-1.3.2.win32-py2.7.exe

Joblib Package
Install joblib via pip - open a command prompt and enter the command
>pip install joblib 

GEOS 
1)	Copy the file 
     %GeoEngine_Dependencies%\install\32-bit_installers\geos_c.dll 
            to
     C:\Python27\Lib\site-packages\shapely\DLLs
2)	If geos_c.dll already exists, rename the original and copy over the provided version.
3)	Set the Environmental Variable:
GEOS_LIBRARY_PATH: C:\Python27\Lib\site-packages\shapely\DLLs\geos_c.dll 

Rasterstats
1)	Open a command prompt and navigate to %GeoEngine_Dependencies%\install\32-bit_installers\
            >cd %GeoEngine_Dependencies%_pkg\install\32-bit_installers 
2)	Enter the command
            pip install rasterstats-0.3.3.tar.gz
NOTE: Using the provided rasterstats tar gives an SSL warning - this is normal.
3)	Copy the entire %GeoEngine_Dependencies%\python folder to a location of your choice (we recommend C:\EWX\python_scripts).
4)	Navigate to C:\Python27\Lib\site-packages\rasterstats using the Windows file explorer.
5)	Rename the existing main.py file to main.py-org.
6)	Copy the main.py provided in the ‘python_scripts’ folder to the rasterstats directory.
7)	Test Python setup by opening a command prompt and navigating to where you placed rasterstat_test.py (e.g., C:\EWX\python_scripts) and run the command
	python rasterstat_test.py > rasterstat_test_results.txt 
to verify that it is working.
NOTE: Use the full path to Python2.7 if you have another version installed.
8)	You will receive the following warning:
C:\Python27\lib\site-packages\numpy\ma\core.py:3847: UserWarning: Warning: converting a masked element to nan.
  warnings.warn("Warning: converting a masked element to nan.")
This is expected behavior.
9)	Compare the two files: rasterstat_test_results.txt & rasterstat_test_results_compare.txt.
10)	If they compare well, the Python setup is a success!

Java Runtime Environment
1)	Run %GeoEngine_Dependencies%\install\jre-8u111-windows-x64.exe
2)	Set the Environmental Variable:
JAVA_HOME: C:\Program Files\Java\jre1.8.0_111

GeoServer
1)	Create a geoserver directory (we recommend C:\EWX\geoserver).
2)	Extract the files in %GeoEngine_Dependencies%\install\geoserver-2.11.0-bin.zip to C:\EWX\geoserver.
3)	Copy the contents of %GeoEngine_Dependencies%\data_dir to C:\EWX\geoserver\geoserver-2.11.0\data_dir
4)	Edit the web.xml file located in C:\EWX\geoserver\geoserver-2.11.0\webapps\geoserver\WEB-INF\
5)	Set the <param-value> of GEOSERVER_DATA_DIR to the path C:\EWX\geoserver\geoserver-2.11.0\data_dir 
(the data_dir referenced in step 3).

Tomcat
1)	Run the Apache executable to install Apache:
%GeoEngine_Dependencies%\install\apache-tomcat-8.5.8.exe 
2)	We recommend you install tomcat in to the C:\EWX directory.
3)	Choose the minimum install and all defaults suggested by installation wizard (except for the install directory - see step 2).
4)	Allow the installer to start Apache Tomcat (keep the Start Tomcat box checked) after install.
5)	Make sure port 8080 is open in the Windows Firewall (if the port is not open, go to ControlPanel>System Security>Windows Firewall>Advanced Settings>inboundRules>New Rule, choose port, TCP 8080).

GeoServer (Part 2)
1)	Copy %GeoEngine_Dependencies%\geoserver\geoserver.xml 
             to 
             C:\EWX\tomcat\conf\Catalina\localhost\
2)	If needed, modify the docBase path in geoserver.xml to point to the correct version of GeoServer. For example: C:\EWX\geoserver\geoserver-2.11.0\webapps\geoserver
3)	If tomcat is not running, open a command prompt and navigate to C:\EWX\tomcat\bin
	>cd C:\EWX\tomcat\bin
5)	Enter the command 
>catalina.bat start 
6)	The output will look something like the example below:
C:\EWX\tomcat\bin> catalina.bat start
Using CATALINA_BASE:   "C:\EWX\tomcat"
Using CATALINA_HOME:   "C:\EWX\tomcat"
Using CATALINA_TMPDIR: "C:\EWX\tomcat\temp"
Using JRE_HOME:        "C:\Program Files\Java\jre1.8.0_111"
Using CLASSPATH:       "C:\EWX\tomcat\bin\bootstrap.jar;C:\EWX\tomcat\bin\tomcat-juli.jar"
7)	Leave the resulting window open - tomcat will start up and keep running in this window. 
8)	Open an internet browser and enter the URL http://localhost:8080/geoserver
9)	Login using the default username/password (admin, geoserver).
10)	CHANGE THE DEFAULT ADMIN PASSWORD by doing the following:
11)	On the left hand menu, click Users, Groups, Roles.
12)	Click the Users tab.
13)	Click on the admin Username.
14)	Enter new password.
15)	Click Save at the bottom of thepage.

MySQL
1)	Run the included MySQL install file: %GeoEngine_Dependencies%\install\mysql-installer-web-community-5.7.16.0.msi
2)	Select Server Only, click Next, then click Execute.
3)	Ready to Configure, Next.
4)	Choose Server Machine from drop down menu, keep the rest at default values.
5)	Create root password and add user “ewx”.
6)	Keep the next window at default values, as well as the window after that.
7)	To use mysql in a command prompt, add C:\Program Files\MySQL\MySQL Server 5.7\bin to the “Path” Environmental Variable.
8)	Open the MySQL command client (or a command prompt), enter root password.
             >mysql -u root -p
9)	Enter the commands: 
mysql> create schema ewx;
mysql> use ewx;
mysql> grant usage on *.* to ewx@localhost identified by 'SET_PASSWORD';
mysql> grant all privileges on ewx.* to ewx@localhost;
mysql> flush privileges;
10)	Make sure port 3306 is open in the Windows Firewall (if the port is not open, go to ControlPanel-->System Security-->Windows Firewall-->Advanced Settings-->inboundRules-->New Rule, choose port, TCP 3306).
