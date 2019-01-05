class CaptureRenderer extends Event {

    constructor($canvas, $bg, imageSrc, scaleFactor) {
        super();
        // ...

        this.init().then(() => {
            console.log('init')
        })
    }

    async init() {
        this.$bg.style.backgroundImage = `url(${this.imageSrc})`
        this.$bg.style.backgroundSize = `${width}px ${height}px`
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        let img = await new Promise(resolve => {
            let img = new Image()
            img.src = this.imageSrc
            if (img.complete) {
                resolve(img)
            } else {
                img.onload = () => resolve(img)
            }
        });

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        this.bgCtx = ctx
        // ...
    }

    // ...

    onMouseDrag(e) {
        // ...
        this.selectRect = {x, y, w, h, r, b}
        this.drawRect()
        this.emit('dragging', this.selectRect)
        // ...
    }

    drawRect() {
        if (!this.selectRect) {
            this.$canvas.style.display = 'none'
            return
        }
        const { x, y, w, h } = this.selectRect

        const scaleFactor = this.scaleFactor
        let margin = 7
        let radius = 5
        this.$canvas.style.left = `${x - margin}px`
        this.$canvas.style.top = `${y - margin}px`
        this.$canvas.style.width = `${w + margin * 2}px`
        this.$canvas.style.height = `${h + margin * 2}px`
        this.$canvas.style.display = 'block'
        this.$canvas.width = (w + margin * 2) * scaleFactor
        this.$canvas.height = (h + margin * 2) * scaleFactor

        if (w && h) {
            let imageData = this.bgCtx.getImageData(x * scaleFactor, y * scaleFactor, w * scaleFactor, h * scaleFactor)
            this.ctx.putImageData(imageData, margin * scaleFactor, margin * scaleFactor)
        }
        this.ctx.fillStyle = '#ffffff'
        this.ctx.strokeStyle = '#67bade'
        this.ctx.lineWidth = 2 * this.scaleFactor

        this.ctx.strokeRect(margin * scaleFactor, margin * scaleFactor, w * scaleFactor, h * scaleFactor)
        this.drawAnchors(w, h, margin, scaleFactor, radius)
    }

    drawAnchors(w, h, margin, scaleFactor, radius) {
        // ...
    }

    onMouseMove(e) {
        // ...
        document.body.style.cursor = 'move'
        // ...
    }

    onMouseUp(e) {
        this.emit('end-dragging')
        this.drawRect()
    }

    getImageUrl() {
        const { x, y, w, h } = this.selectRect
        if (w && h) {
            let imageData = this.bgCtx.getImageData(x * scaleFactor, y * scaleFactor, w * scaleFactor, h * scaleFactor)
            let canvas = document.createElement('canvas')
            let ctx = canvas.getContext('2d')
            ctx.putImageData(imageData, 0, 0)
            return canvas.toDataURL()
        }
        return ''
    }

    reset() {
        // ...
    }
}
