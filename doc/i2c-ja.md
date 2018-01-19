# Peripherals I2C
i2cを利用できます。
i2cは１つのみ利用可能でi2c0のみ存在します。
通信速度は最大1Mhzです。

## start(mode, io_sda, io_scl, frequency, pull-up)

i2cを有効化します。
SDA, SCLとして利用するioの番号が必要です。
また、通信速度はhzで指定します。
ioは自動的にオープンドレインに切り替わります。
i2cではプルアップ抵抗が必要ですが、ioの内部pull-upも行うことが出来ます。
文字列で指定できて、選べるのは３通りです。

1. "float"
2. "pullup"
3. "pullup5v"

3.3vの相手と通信を行う場合はpullupを選びます。これにより3.3vでpullupされます。回路的な制約により2.9v程度になります。
5vの相手と通信を行う場合で速度が遅くても良い場合は pullup5v を選びます。5vの内部プルアップが有効になります。

通信速度は"pullup"の場合は最大100khz、それ以外の場合は最大1Mhzまで指定できます。

よりノイズの少ない安定した通信をするためには外部抵抗でプルアップすることをおすすめします。
400khzでの通信であっても外部で2.2kOhm程度でのプルアップ抵抗をSDA,SCL端子に接続して下さい。

```Javascript
// Example
// master mode sda=2 scl=3 400khz no pullup
obniz.i2c0.start("master", 2, 3, 400000, "float"); 
obniz.i2c0.write(0x50, [0x00, 0x00, 0x12]);
```
## end()

i2cを終了しIOを開放します。

```Javascript
// Example
// master mode sda=2 scl=3 400khz no pullup
obniz.i2c0.start("master", 2, 3, 400000, "float"); 
obniz.i2c0.end();
```
## write(address, data);

addressにデータを送信します。
addressが0x7Fより大きな場合は自動的に10bitアドレスとして送信します。
それより小さな値でも10bitアドレスとして送信したい場合はwrite10bit関数を使って下さい。

Example

```Javascript
// Example
// master mode sda=2 scl=3 400khz no pullup
obniz.i2c0.start("master", 2, 3, 400000, "float"); 
obniz.i2c0.write(0x50, [0x00, 0x00, 0x12]);
```
## write10bit(address, data);

addressにデータを送信します。
addressの値が何であれ必ず10bitアドレスモードで送信します。

```Javascript
// Example
// master mode sda=2 scl=3 400khz no pullup
obniz.i2c0.start("master", 2, 3, 400000, "float"); 
obniz.i2c0.write10bit(0x50, [0x00, 0x00, 0x12]);
```
## [await] readWait(address, length);

addressからlengthで指定しただけデータを読み取ります。
addressの扱いに関してはwriteのものと同じです。

```Javascript
// Example
// master mode sda=2 scl=3 400khz no pullup
obniz.i2c0.start("master", 2, 3, 400000, "float"); 
var ret = await obniz.i2c0.readWait(0x50, 1);
console.log("readed"+ret);
```
## [await] read10bitWait(address, length);

addressからlengthで指定しただけデータを読み取ります。
addressの値が何であれ必ず10bitアドレスモードで送信します。

```Javascript
// Example
// master mode sda=2 scl=3 400khz no pullup
obniz.i2c0.start("master", 2, 3, 400000, "float"); 
var ret = await obniz.i2c0.read10bitWait(0x50, 1);
console.log("readed"+ret);
```