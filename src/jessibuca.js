import Player from './player';
import Events from "./utils/events";
import {DEMUX_TYPE, EVENTS, JESSIBUCA_EVENTS, PLAYER_PLAY_PROTOCOL, SCALE_MODE_TYPE} from "./constant";
import {supportWCS} from "./utils";
import Emitter from "./utils/emitter";


class Jessibuca extends Emitter {
    constructor(options) {
        super()
        let _opt = options;
        let $container = options.container;
        if (typeof options.container === 'string') {
            $container = document.querySelector(options.container);
        }
        if (!$container) {
            throw new Error('Jessibuca need container option');
            return;
        }

        $container.classList.add('jessibuca-container');

        delete _opt.container;

        this._opt = _opt;
        this.$container = $container;
        this.href = null;
        this.events = new Events(this);
        this.player = new Player($container, _opt);
        this._bindEvents();
    }

    _bindEvents() {
        // 对外的事件
        Object.keys(JESSIBUCA_EVENTS).forEach((key) => {
            this.player.on(EVENTS[key], (value) => {
                this.emit(key, value)
            })
        })
    }

    /**
     * 是否开启控制台调试打印
     * @param value {Boolean}
     */
    setDebug(value) {
        this.player.updateOption({
            isDebug: !!value
        })
    }

    /**
     *
     */
    mute() {
        this.player.audio.mute(true);
    }

    /**
     *
     */
    cancelMute() {
        this.player.audio.mute(false);
    }

    /**
     *
     * @param value {number}
     */
    setVolume(value) {
        this.player.audio.setValue(value);
    }

    /**
     *
     */
    audioResume() {
        this.player.audio.audioEnabled(true);

    }

    /**
     * 设置超时时长, 单位秒 在连接成功之前和播放中途,如果超过设定时长无数据返回,则回调timeout事件
     * @param value {number}
     */
    setTimeout(time) {
        this.player.updateOption({
            timeout: Number(time)
        })
    }

    /**
     *
     * @param type {number}: 0,1,2
     */
    setScaleMode(type) {
        type = Number(type);
        let options = {
            isFullResize: false,
            isResize: false
        }
        switch (type) {
            case SCALE_MODE_TYPE.full:
                options.isFullResize = false;
                options.isResize = false;
                break;
            case SCALE_MODE_TYPE.auto:
                options.isFullResize = false;
                options.isResize = true;
                break;
            case SCALE_MODE_TYPE.fullAuto:
                options.isFullResize = true;
                options.isResize = true;
                break;
        }

        this.player.updateOption(options);
        this.player.video.resize();
    }

    /**
     *
     */
    pause() {
        this.player.pause();
    }

    /**
     *
     */
    close() {
        this.player.close();
    }


    /**
     *
     */
    clearView() {
        this.player.video.clearView()
    }

    /**
     *
     * @param url {string}
     * @returns {Promise<unknown>}
     */
    play(url) {
        return new Promise((resolve, reject) => {
            if (!url && !this._opt.url) {
                reject();
                return;
            }

            if (url) {
                // url 相等的时候。
                if (this._opt.url && (url === this._opt.url)) {
                    resolve();
                    return;
                } else {
                    this._opt.url = url;
                    //  新的url
                    const isHttp = url.indexOf("http") === 0;
                    //
                    const protocol = isHttp ? PLAYER_PLAY_PROTOCOL.fetch : PLAYER_PLAY_PROTOCOL.websocket
                    //
                    const demuxType = (isHttp || url.indexOf(".flv") !== -1 || this._opt.isFlv) ? DEMUX_TYPE.flv : DEMUX_TYPE.m7s;

                    this.player.updateOption({
                        protocol,
                        demuxType
                    })

                    if (this.hasLoaded()) {
                        this.player.play(url).then(() => {
                            resolve();
                        }).catch(() => {
                            this.player.close();
                            reject();
                        })
                    } else {
                        this.player.once(EVENTS.load, () => {
                            this.player.play(url).then(() => {
                                resolve();
                            }).catch(() => {
                                this.player.close();
                                reject();
                            })
                        })
                    }
                }
            } else {
                //  url 不存在的时候
                //  就是从 play-> pause -> play
                this.player.resume();
            }
        })
    }

    resize() {
        this.player.video.resize();
    }

    /**
     *
     * @param time {number}
     */
    setBufferTime(time) {
        time = Number(time)
        if (this.player) {

        } else {
            this._opt.videoBuffer = time
        }
    }

    /**
     *
     * @param deg {number}
     */
    setRotate(deg) {
        deg = parseInt(deg, 10)
        const list = [0, 90, 270];
        if (this._opt.rotate === deg || list.indexOf(deg) === -1) {
            return;
        }
        this.player.updateOption({
            rotate: deg
        })
        this.resize();
    }

    hasLoaded() {
        return this.player.loaded;
    }

    setKeepScreenOn() {
        this.player.updateOption({
            keepScreenOn: true
        })
    }

    useWCS() {
        this._opt.useWCS = supportWCS();
    }

    /**
     *
     * @param flag {Boolean}
     */
    setFullscreen(flag) {
        const fullscreen = !!flag;
        if (this.player.fullscreen !== fullscreen) {
            this.player.fullscreen = fullscreen;
        }
    }

    /**
     *
     * @param filename {string}
     * @param format {string}
     * @param quality {number}
     * @param type {string} download,base64,blob
     */
    screenshot(filename, format, quality, type) {
        return this.player.video.screenshot(filename, format, quality, type)
    }

    /**
     *
     * @returns {Boolean}
     */
    isPlaying() {
        return this.player.playing;
    }

    /**
     * 是否静音状态
     * @returns {Boolean}
     */
    isMute() {
        return this.player.audio.isMute();
    }

    /**
     *
     */
    destroy() {
        this.player.destroy();
        this.player = null;
    }
}


window.Jessibuca = Jessibuca;

export default Jessibuca;