import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService) {}
    
    private hit: number           = 1
    private defaultTtl: number    = Number(process.env.TTL)
    private defaultHit: number    = Number(process.env.HIT)
    private defaultLimit: number  = Number(process.env.LIMIT)

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest()
        const userAgent = request.get('user-agent') || ''
        const { ip, method, path, user } = request
        
        const users     = await this.getUserSignin(user.id)
        let ttl         = users?.ttl ?? this.defaultTtl;
        let timeNow     = new Date().getTime();
        let timeUser    = users?.lastHitAt?.getTime() ?? (timeNow - 6001);
        let timeRequest = timeNow - timeUser;
        let defaultHit  = users?.defaultHit ?? this.defaultHit;
        let limit       = users?.limitHit ?? this.defaultLimit;

        let seconds = Math.floor(ttl / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours   = Math.floor(minutes / 60);
        let time    = ''
        seconds     = seconds % 60;
        minutes     = minutes % 60;
        hours       = hours % 24;

        if (seconds != 0) {
            time = seconds+' detik';
        } else if (minutes != 0) {
            time = minutes+' menit'
        } else if (hours != 0) {
            time = hours+' jam'
        }

        console.log(`\x1b[36m |============================== SESSION - ${(users?.username)?.toUpperCase()} ===============================| \x1b[0m`)
        console.log(`  \x1b[32m UserID         :\x1b[0m \x1b[33m${users?.id}\x1b[0m`) 
        console.log(`  \x1b[32m Waktu Sekarang :\x1b[0m \x1b[33m${this.convertMsToTime(timeNow)}\x1b[0m       \x1b[32m Detik Sekarang :\x1b[0m \x1b[33m${timeNow}\x1b[0m`)
        console.log(`  \x1b[32m Waktu Login    :\x1b[0m \x1b[33m${this.convertMsToTime(timeUser)}\x1b[0m       \x1b[32m Detik Terakhir :\x1b[0m \x1b[33m${timeUser}\x1b[0m`)
        console.log('                                       ------------------------------- -')
        console.log(`  \x1b[32m Limit HIT anda :\x1b[0m \x1b[33m${defaultHit}\x1b[0m               \x1b[32m Detik Sisa     :\x1b[0m \x1b[33m${timeRequest}\x1b[0m`)
        console.log(`  \x1b[32m Limit HIT sisa :\x1b[0m \x1b[33m${limit}\x1b[0m               \x1b[32m Limit TTL      :\x1b[0m \x1b[33m${ttl}\x1b[0m`)
        console.log('\x1b[36m |===============================================================================| \x1b[0m')
        if (timeRequest > ttl) {
            if (users?.lastHitAt == null || limit < 1) {
                if (limit == 0 && timeRequest > ttl) {
                    console.log('\x1b[90m =>\x1b[0m Yaahh, limit hit kamu tersisa 0 sepertinya kamu akan terkena antrean.')
                    await this.OnlyUpdateHitAt(user.id)
                    throw new HttpException(`The API access limited for this user, please wait until ${this.convertMsToTime(ttl)}.`, HttpStatus.REQUEST_TIMEOUT)
                } else if (limit == -1 && timeRequest > ttl) {
                    console.log('\x1b[90m =>\x1b[0m Horree, anda berhasil terhubung kembali dengan kami :)')
                    await this.firstHitUser(user.id, defaultHit)
                } else {
                    console.log(`\x1b[90m =>\x1b[0m selamat datang, sepertinya anda pengguna baru. kami sudah menambahkan limit default ke pengaturan anda.`)
                    await this.newRegistApiUser(user.id, defaultHit, ttl)
                }
            } else {
                console.log(`\x1b[90m =>\x1b[0m Oops, sepertinya detik sisa anda telah melewati limit TTL`)
                await this.lesHitUser(user.id, (Number(users?.limitHit) - this.hit))
            }
        } else {
            if (timeRequest < ttl && limit > 1) {
                console.log(`\x1b[90m =>\x1b[0m Yeayy, limit hit sisa anda berhasil di refresh.`)
                await this.firstHitUser(user.id, defaultHit)
            } else {
                console.log(`\x1b[90m =>\x1b[0m Yaahh, sepertinya kamu terkena antrean limit. Harap bersabar yaaa`)
                throw new HttpException(`The API access limited for this user, please wait until ${this.convertMsToTime(ttl)}.`, HttpStatus.REQUEST_TIMEOUT)
            }
        }

        return next.handle();
    }

    async getUserSignin(userId: string) {
        const users = await this.prisma.users.findUnique({
            where: {
                id: userId
            }
        });

        return users;
    }

    async firstHitUser(userId: string, userLimit: number) {
        try {
            const users = await this.prisma.users.update({
                where: {
                    id: userId
                },
                data: {
                    limitHit: userLimit,
                    lastHitAt: new Date().toISOString()
                }
            });
            return users;
        } catch (error) {
            console.log(error)
        }
    }

    async OnlyUpdateHitAt(userId: string) {
        try {
            const users = await this.prisma.users.update({
                where: {
                    id: userId
                },
                data: {
                    lastHitAt: new Date().toISOString(),
                    limitHit: -1,
                }
            });
            return users;
        } catch (error) {
            console.log(error)
        }
    }

    async lesHitUser(userId: string, userLimit: number) {
        try {
            const users = await this.prisma.users.update({
                where: {
                    id: userId
                },
                data: {
                    limitHit: userLimit
                }
            });
            return users;
        } catch (error) {
            console.log(error)
        }
    }

    async newRegistApiUser(userId: string, userLimit: number, ttl: number) {
        try {
            const users = await this.prisma.users.update({
                where: {
                    id: userId
                },
                data: {
                    limitHit: userLimit,
                    ttl,
                    lastHitAt: new Date().toISOString()
                }
            });
            return users;
        } catch (error) {
            console.log(error)
        }
    }

    padTo2Digits(num: number) {
        return num.toString().padStart(2, '0');
    }

    convertMsToTime (milliseconds: number) {
        let seconds = Math.floor(milliseconds / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
    
        seconds = seconds % 60;
        minutes = minutes % 60;
    
        // 👇️ If you don't want to roll hours over, e.g. 24 to 00
        // 👇️ comment (or remove) the line below
        // commenting next line gets you `24:00:00` instead of `00:00:00`
        // or `36:15:31` instead of `12:15:31`, etc.
        hours = hours % 24;
    
        return `${this.padTo2Digits(hours)}h:${this.padTo2Digits(minutes)}m:${this.padTo2Digits(
            seconds,
        )}s`;
    }
}