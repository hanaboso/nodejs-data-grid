import { entity, t } from '@deepkit/type';

@entity.name('example')
export default class ExampleEntity {

  @t.primary.autoIncrement public id: number = 0;

  constructor(
    @t public name: string
  ) {
  }

}
