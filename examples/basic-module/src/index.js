import { WagonboxModule } from '@wagonbox/sdk';

export default class HelloModule extends WagonboxModule {
  async onInit() {
    console.log(`[${this.moduleId}] init`);
  }
  async onStart() {
    await this.registerRoute('GET', '/hello', 'hello.sayHello');
  }
  async sayHello() {
    const out = await this.shell.execute('echo', ['hello from ' + this.moduleId]);
    await this.storage.write('hello.txt', out.stdout);
    return { message: out.stdout.trim() };
  }
}
