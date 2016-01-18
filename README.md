# EVE - Command line tool

## Install

```
$ npm install eve
```

## File limit

If `EMFILE` file is triggered use the command `ulimit -n 2048` to fix it.



### Variable ENV

Per salvare le variabile d'ambiente in Windows segui http://stackoverflow.com/a/9250168

Linux or Mac `nano ~/.profife`

```
export JSCRAMBLER_ACCESSKEY=<MY KEY>
export JSCRAMBLER_SECRETKEY=<MY SECRET>
```


eve-configs-production
eve-configs-development

`eve-configs` generato a seconda dell envarioment selezionato.

### jScrambler

Le chiavi vanno nel .profile