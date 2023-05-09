import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prismaClient, throwError } from '../helpers';

const MEMBER_ROLES = ['USER', 'MERCHANT', 'ADMIN'] as const;

type MemberRole = (typeof MEMBER_ROLES)[number];
type Member = {
  id: string;
  account: string;
  name: string;
  email: string;
  role: MemberRole;
  passhash: string | null;
};

export class AuthService {
  static BCRYPT_SALT = process.env.BCRYPT_SALT || 8;
  static login = async (options: {
    account: string;
    password: string;
  }): Promise<{ authToken: string; member: Omit<Member, 'passhash'> }> => {
    // get possible members
    const { account, password } = options;
    const member = await AuthService.getMemberByAccountOrEmail(account);
    if (!member) {
      return throwError({ code: 401, message: 'no such member' });
    }

    // check password
    if (member.passhash && !bcrypt.compareSync(password, member.passhash)) {
      return throwError({ code: 403, message: 'password does not match' });
    }

    const publicMember: Omit<Member, 'passhash'> = {
      id: member.id,
      account: member.account,
      email: member.email,
      name: member.name,
      role: member.role,
    };
    const authToken = await AuthService.signJWT({
      sub: member.id,
      memberId: member.id,
      name: member.name,
      account: member.account,
      email: member.email,
      role: member.role,
    });
    return { authToken, member: publicMember };
  };
  static registerMember = async (profile: {
    account: string;
    name?: string;
    email: string;
    password?: string | null;
  }): Promise<{ authToken: string; member: Omit<Member, 'passhash'> }> => {
    const memberId = uuidv4();
    const passhash = profile.password && (await bcrypt.hash(profile.password, this.BCRYPT_SALT));
    try {
      const data = await prismaClient.member.create({
        data: {
          id: memberId,
          account: profile.account,
          passhash,
          email: profile.email,
          name: profile.name || profile.account,
          role: profile.account.startsWith('admin') ? 'MERCHANT' : 'USER',
        },
      });
      const memberData = data || null;

      const publicMember: Omit<Member, 'passhash'> = {
        id: memberData.id,
        account: memberData.account,
        email: memberData.email,
        name: memberData.name,
        role: memberData.role,
      };
      const authToken = await AuthService.signJWT({
        sub: memberData.id,
        memberId: memberData.id,
        name: memberData.name,
        account: memberData.account,
        email: memberData.email,
        role: memberData.role,
      });
      return { authToken, member: publicMember };
    } catch (error) {
      return throwError({ message: (error as Error).message });
    }
  };
  static signJWT = async (
    payload: {
      sub: string;
      memberId?: string;
      name?: string;
      account?: string;
      email?: string;
      role: string;
    },
    expiresIn = '1 day',
  ) => {
    if (!process.env.POINT_PRO_SECRET) {
      throw new Error('no jwt secret');
    }
    return jwt.sign(payload, process.env.POINT_PRO_SECRET, { expiresIn });
  };
  static getMemberByAccountOrEmail = async (query: string): Promise<Member | null> => {
    const member = await prismaClient.member.findFirst({
      where: {
        OR: [
          {
            account: query,
          },
          {
            email: query,
          },
        ],
      },
    });
    console.log(member);

    return member || null;
  };
}
