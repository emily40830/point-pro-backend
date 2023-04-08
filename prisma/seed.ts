import { Prisma, PrismaClient, member } from '@prisma/client';

const client = new PrismaClient();

const getMembers = (): Prisma.memberCreateInput[] => [
  { account: 'test', name: 'bob' },
  { account: 'test1', name: 'steve' },
  { account: 'test2', name: 'charley' },
];

const main = async () => {
  await Promise.all(getMembers().map((member) => client.member.create({ data: member })));
};

main();
