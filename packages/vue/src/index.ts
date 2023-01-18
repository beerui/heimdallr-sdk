import { formatDate, generateUUID } from '@heimdallr-sdk/utils';
import {
  UnknownFunc,
  BasePluginType,
  ViewModel,
  VueReportDataType,
  ReportDataType,
  EventTypes,
  BrowserBreadcrumbTypes,
  VueTypes
} from '@heimdallr-sdk/types';

const PLUGIN_NAME = 'vuePlugin';

const Tag = `[@heimdallr-sdk/${PLUGIN_NAME}]: `;

const VuePlugin: BasePluginType = {
  name: PLUGIN_NAME,
  monitor(notify: (eventName: string, data: VueReportDataType) => void) {
    const { vue: vm } = this.getOptions();
    const { debug } = this.context;
    if (!vm) {
      console.error(Tag, 'missing Vue in options');
      return;
    }
    const { errorHandler, silent } = vm.config;
    vm.config.errorHandler = (error: Error, vm: ViewModel, lifecycleHook: string) => {
      const { name, message, stack } = error;
      notify(PLUGIN_NAME, {
        name,
        message,
        hook: lifecycleHook,
        stack,
        sub_type: VueTypes.ERROR
      });
      if (debug) {
        if (typeof errorHandler === 'function') {
          (errorHandler as UnknownFunc).call(this.vm, error, vm, lifecycleHook);
        } else if (!silent) {
          const message = `Error in ${lifecycleHook}: "${stack && stack.toString()}"`;
          console.error(`[Vue error]: ${message}`);
        }
      }
    };
  },
  transform(data: VueReportDataType): ReportDataType<VueReportDataType> {
    // 添加用户行为栈
    const id = generateUUID();
    this.breadcrumb.unshift({
      eventId: id,
      type: BrowserBreadcrumbTypes.FRAMEWORK,
      data
    });
    const breadcrumb = this.breadcrumb.getStack();
    this.breadcrumb.clear();
    return {
      id,
      time: formatDate(),
      type: EventTypes.VUE,
      breadcrumb,
      data
    };
  }
};

export default VuePlugin;
