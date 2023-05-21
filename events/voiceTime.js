/** @format */

const { Events } = require("discord.js");
const cron = require("node-cron");
const prisma = require("../utils/prisma");
const dotenv = require("dotenv");
const logger = require("../utils/winston");

dotenv.config();

function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

function convertMsToTime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;


  return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(
    seconds
  )}`;
}
const currentTime = new Date().toLocaleTimeString();
console.log("Current Time:", currentTime);
let currentDate = new Date().toJSON().slice(0, 10);
let bot_start_time = Date.now();

const logged_data = new Map();

cron.schedule("* 22 * * *", async () => {
  logged_data.clear();
});

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const checkUserAllowed = await prisma.user.findFirst({
      where: { user_id: newState.member.user.tag },
      include: {
        stats: true,
      },
    });
    if (checkUserAllowed) {
      if (
        oldState.member.roles.cache.find((r) =>
          JSON.parse(process.env.ALLOWED_ROLE).includes(r.name)
        )
      ) {
        logged_data.get(newState.member.user.tag)
          ? null
          : logged_data.set(newState.member.user.tag, {
              user_id: newState.member.user.tag,
              log: {
                join: [],
                leave: [],
                move: [],
              },
              initial_time: bot_start_time,
              join_vc_time: 0,
              leave_vc_time: 0,
              total_time: 0,
              afk_start_time: 0,
              afk_end_time: 0,
              total_inactive: 0,
              move_vc_time: 0,
              worked_time: null,
              checkStat: null,
              checkUser: null,
            });

        const checkUser = await prisma.user.findFirst({
          where: { user_id: newState.member.user.tag },
          include: {
            stats: true,
          },
        });
        logged_data.get(newState.member.user.tag).checkUser = checkUser;

        const checkStat = await prisma.stats.findFirst({
          where: {
            date: new Date().toLocaleDateString(),
          },
        });
        logged_data.get(newState.member.user.tag).checkStat = checkStat;

        if (oldState.channelId == null) {
          logged_data.get(newState.member.user.tag).initial_time = Date.now();

          let join_log_date_obj = new Date();

          logged_data.get(newState.member.user.tag).join_vc_time =
            join_log_date_obj.toLocaleTimeString();

          logged_data
            .get(newState.member.user.tag)
            .log.join.push(
              `${newState.member.user.tag} Joined ${newState.channel.name} at ${
                logged_data.get(newState.member.user.tag).join_vc_time
              }`
            );

          logger.info(
            `${newState.member.user.tag} joined ${newState.channel.name}`
          );
        }
        if (newState.channelId == null) {
          if (oldState.channelId == process.env.INACTIVE_CHANNELID) {
            logged_data.get(newState.member.user.tag).afk_end_time = Date.now();

            let updated_time =
              logged_data.get(newState.member.user.tag).afk_end_time -
              logged_data.get(newState.member.user.tag).afk_start_time;

            logged_data.get(newState.member.user.tag).total_inactive =
              logged_data.get(newState.member.user.tag).total_inactive +
              updated_time;
          }

          let final_time = Date.now();
          let leave_log_date_obj = new Date();

          let updated_time =
            final_time - logged_data.get(newState.member.user.tag).initial_time;
          // logger.info("updated_time " + convertMsToTime(updated_time))
          // logger.info("total time " + convertMsToTime(total_time))

          logged_data.get(newState.member.user.tag).total_time =
            logged_data.get(newState.member.user.tag).total_time +
            updated_time -
            logged_data.get(newState.member.user.tag).total_inactive;

          logged_data.get(newState.member.user.tag).leave_vc_time =
            leave_log_date_obj.toLocaleTimeString();
          // vc_log.leave.push(
          //   `Left ${oldState.channel.name} at ${leave_vc_time}`
          // );
          logged_data
            .get(newState.member.user.tag)
            .log.leave.push(
              `${newState.member.user.tag} Left ${oldState.channel.name} at ${
                logged_data.get(newState.member.user.tag).leave_vc_time
              }`
            );

          logged_data.get(newState.member.user.tag).worked_time =
            convertMsToTime(
              logged_data.get(newState.member.user.tag).total_time
            );

          logger.info(
            `${newState.member.user.tag} left ${oldState.channel.name} at ${currentTime}`
          );

          logger.info(
            `${newState.member.user.tag} worked for ${convertMsToTime(
              logged_data.get(newState.member.user.tag).total_time
            )}`
          );

          if (
            logged_data.get(oldState.member.user.tag).checkUser.stats.length ==
              0 ||
            logged_data.get(oldState.member.user.tag).checkUser.stats[0].date !=
              new Date().toLocaleDateString()
          ) {
            const statsCreate = await prisma.stats.create({
              data: {
                date: new Date().toLocaleDateString(),
                total_time: logged_data.get(oldState.member.user.tag)
                  .worked_time,
                user: {
                  connect: {
                    id: logged_data.get(oldState.member.user.tag).checkUser.id,
                  },
                },
              },
            });
          }
          try {
            console.log(logged_data.get(newState.member.user.tag).checkUser)
            const add_stats = await prisma.stats.update({
              data: {
                total_time: logged_data.get(newState.member.user.tag)
                  .worked_time,
                user: {
                  connect: {
                    id: logged_data.get(newState.member.user.tag).checkUser.id,
                  },
                },
              },
              where: {
                id: logged_data.get(newState.member.user.tag).checkUser.stats[0].id,
              },
            });            
          } catch (error) {
            logger.error(error)
          }
        }
        if (
          oldState.channelId != null &&
          newState.channelId != null &&
          oldState.channelId != newState.channelId
        ) {
          // let final_time = Date.now();
          let move_log_date_obj = new Date();
          // let updated_time = final_time - initial_time;
          logged_data.get(newState.member.user.tag).move_vc_time =
            move_log_date_obj.toLocaleTimeString();

          logged_data
            .get(newState.member.user.tag)
            .log.move.push(
              `${newState.member.user.tag} Moved to ${
                newState.channel.name
              } at ${logged_data.get(newState.member.user.tag).move_vc_time}`
            );
          // total_time = total_time + updated_time;
          // logger.info("total time in moved " + convertMsToTime(total_time))
          logger.info(
            `${newState.member.user.tag} moved to ${newState.channel.name}`
          );
          if (
            oldState.channelId != null &&
            newState.channelId == process.env.INACTIVE_CHANNELID
          ) {
            logged_data.get(newState.member.user.tag).afk_start_time =
              Date.now();
            // logger.info('hello')
          }
          if (
            oldState.channelId == process.env.INACTIVE_CHANNELID &&
            newState.channelId != process.env.INACTIVE_CHANNELID
          ) {
            logged_data.get(newState.member.user.tag).afk_end_time = Date.now();
            // logger.info('hi')
            let updated_time =
              logged_data.get(newState.member.user.tag).afk_end_time -
              logged_data.get(newState.member.user.tag).afk_start_time;
            // logger.info("afk start " + convertMsToTime(afk_start_time) + "  " + "afk end " + convertMsToTime(afk_end_time))
            logged_data.get(newState.member.user.tag).total_inactive =
              logged_data.get(newState.member.user.tag).total_inactive +
              updated_time;
            // logger.info("total inactive " + convertMsToTime(total_inactive))
            // logger.info("updated time move " + convertMsToTime(updated_time))
          }
        }
      }
    } else {
      logger.warn(newState.member.user.tag + " not registered!");
    }
  },
};
