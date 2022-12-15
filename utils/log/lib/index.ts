'use strict';
import log from 'npmlog';
log.level = process.env.LOG_LEVEL ?? 'info';
log.heading = 'mc91';
log.addLevel('success', 2000, { fg: 'green', bold: true });
export default log;
